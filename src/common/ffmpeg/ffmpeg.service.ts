import { Injectable, Logger } from '@nestjs/common';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as ffprobeInstaller from '@ffprobe-installer/ffprobe';
/**
 * FFmpeg ubuntu 환경에서 오류 발생 아래 명령어로 해결
 * sudo apt update
 * sudo at install nscd
 * sudo systemctl start nscd.service
 * https://www.youtube.com/watch?v=5vdXv2Vk4sc
 */
import * as ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'stream';
import { FluentffmpegMetadata } from 'src/interfaces/ffmpeg.intetface';
import { join } from 'path';
import { mkdir } from 'fs/promises';

class BufferStream extends Readable {
  private offset = 0;

  constructor(private buffer: Buffer) {
    super();
  }

  _read(size) {
    if (this.offset >= this.buffer.length) {
      this.push(null);
      return;
    }

    this.push(this.buffer.slice(this.offset, this.offset + size));
    this.offset += size;
  }
}

@Injectable()
export class FfmpegService {
  private ffmpegClient = null;
  private logger = new Logger(FfmpegService.name);
  // private waterMarkFileDir = './metadata/water-mark.png';
  private waterMarkFileDir = './metadata/mclose_watermark.png';

  constructor() {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    ffmpeg.setFfprobePath(ffprobeInstaller.path);

    this.ffmpegClient = ffmpeg;

    if (!this.ffmpegClient) {
      this.logger.error('FFmpegClient not initialized');
    } else {
      this.logger.log('FFmpeg initialized');
    }
  }

  getFfmpegClient() {
    try {
      if (!this.ffmpegClient) {
        this.logger.error('FFmpegClient not initialized');
        return null;
      }
      return this.ffmpegClient;
    } catch (e) {
      this.logger.error('Error in getFfmpegClient', e);
      return null;
    }
  }

  async isExistUploadDir(outputDir: string): Promise<boolean> {
    try {
      const targetDir = join(process.cwd(), outputDir);

      const isExist = await mkdir(targetDir, { recursive: true });
      if (isExist) {
        this.logger.log(`Created directory: ${targetDir}`);
        return true;
      } else {
        this.logger.log(`Directory already exists: ${targetDir}`);
      }

      return true;
    } catch (e) {
      this.logger.error('Error in isExistUploadDir', e);
      return false;
    }
  }

  /**
   * Extracts Thumbnail from a video file
   * @param input
   * @param output
   * @param timestamp
   * @param thumbnailName
   * @param size
   * @returns
   */
  async extractThumbnailToPath(
    input: string | Buffer,
    output: string,
    timestamp = '00:00:01.000',
    thumbnailName = 'thumbnail.png',
    outputSize = '320x240',
  ): Promise<string> {
    try {
      if (!this.ffmpegClient) {
        this.logger.error('FFmpegClient not initialized');
        return null;
      }

      // Check if input is a string or a buffer
      if (typeof input === 'string') {
        return new Promise((resolve, reject) => {
          this.ffmpegClient(input)
            .screenshots({
              timestamps: [timestamp],
              filename: thumbnailName,
              folder: output,
              outputSize,
            })
            .on('end', () => {
              this.logger.log('Thumbnail extraction complete');
              resolve(output);
            })
            .on('error', (err) => {
              reject(err);
            });
        });
      } else {
        const fileStream = new BufferStream(input);
        return new Promise((resolve, reject) => {
          this.ffmpegClient(fileStream)
            .screenshots({
              timestamps: [timestamp],
              filename: thumbnailName,
              folder: output,
              outputSize,
            })
            .on('end', () => {
              this.logger.log('Thumbnail extraction complete');
              resolve(output);
            })
            .on('error', (err) => {
              reject(err);
            });
        });
      }
    } catch (e) {
      this.logger.error('Error in extractThumbnail', e);
      return null;
    }
  }

  /**
   * Extracts Metadata from a video file
   * @param input
   * @returns
   */
  async extractMetadata(input: Buffer | string): Promise<FluentffmpegMetadata> {
    try {
      if (!this.ffmpegClient) {
        this.logger.error('FFmpegClient not initialized');
        return null;
      }
      if (typeof input === 'string') {
        return new Promise((resolve, reject) => {
          this.ffmpegClient(input).ffprobe((err, metadata) => {
            if (err) {
              reject(err);
            }
            this.logger.log('Metadata extraction complete');
            resolve(metadata);
          });
        });
      } else {
        const fileStream = new BufferStream(input);
        return new Promise((resolve, reject) => {
          this.ffmpegClient(fileStream).ffprobe((err, metadata) => {
            if (err) {
              reject(err);
            }
            this.logger.log('Metadata extraction complete');
            resolve(metadata);
          });
        });
      }
    } catch (e) {
      this.logger.error('Error in extractMetadata', e);
      return null;
    }
  }

  async addWatermark(
    input: Readable,
    watermark: string | null = this.waterMarkFileDir,
    position: 'center' | 'top' | 'bottom' = 'center',
  ): Promise<Readable | null> {
    try {
      const options = {};
      const outputStream = new PassThrough(); // Set up output stream and array for data accumulation
      const chunks: Uint8Array[] = []; // Set up output stream and array for data accumulation
      const inputWatermark = join(__dirname, watermark);
      let totalBytes = 0;

      if (!input) {
        this.logger.error('Input stream is null');
        return null;
      }
      if (!watermark) {
        this.logger.error('Watermark is null');
        return null;
      }

      // Check FFmpegClient initialization
      if (!this.ffmpegClient) {
        this.logger.error('FFmpegClient not initialized');
        return null;
      }

      // Check options
      switch (position) {
        case 'center':
          options['x'] = '(main_w-overlay_w)/2';
          options['y'] = '(main_h-overlay_h)/2';
          break;

        case 'top':
          options['x'] = '10';
          options['y'] = '10';
          break;

        case 'bottom':
          options['x'] = '10';
          options['y'] = 'main_h-overlay_h-10';
          break;

        default:
          options['x'] = '10';
          options['y'] = '10';
          break;
      }

      // Create a readable stream from the input buffer
      outputStream.on('data', (chunk) => {
        // Accumulate the data chunks
        chunks.push(chunk);
        totalBytes += chunk.length;
      });
      outputStream.on('end', () => {
        // this.logger.log('Stream ended');
      });
      outputStream.on('error', (err) => {
        // this.logger.error('Stream error:', err);
      });

      // Create a writable stream to save the output
      await new Promise<void>((resolve, reject) => {
        this.ffmpegClient()
          .input(input)
          .input(inputWatermark)
          .complexFilter([
            {
              filter: 'overlay',
              options,
            },
          ])
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputFormat('mp4')
          .outputOptions(['-movflags frag_keyframe+empty_moov'])
          .on('start', (commandLine) => {
            this.logger.debug('FFMPEG command:', commandLine);
          })
          .on('progress', (progress) => {
            this.logger.debug('Processing...');
          })
          .on('error', (err) => {
            this.logger.error('Error processing video:', err);
            reject(err);
          })
          .on('end', () => {
            this.logger.log('Processing finished successfully');

            // The outputStream is automatically closed by .pipe(),
            // but explicitly checking for clarity.
            setTimeout(() => {
              if (!outputStream.destroyed) {
                this.logger.debug('Output stream destroyed');
              } else {
                this.logger.debug('Output stream not destroyed');
              }
              resolve();
            }, 1000);
          })
          .pipe(outputStream, { end: true });
      });

      if (totalBytes > 0) {
        this.logger.log('Watermark added successfully');
        const sumBuffer = Buffer.concat(chunks, totalBytes);
        return this.bufferToStream(sumBuffer);
      } else {
        this.logger.error('No data received from stream');
        return null;
      }
    } catch (e) {
      this.logger.error('Exception in addWatermark', e);
      return null;
    }
  }

  private bufferToStream(buffer: Buffer): Readable {
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    return readable;
  }
}
