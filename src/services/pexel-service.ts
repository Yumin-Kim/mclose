import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PexelService {
  private apiKey = null;
  private logger = new Logger(PexelService.name);
  private baseUrl = 'https://api.pexels.com/videos/search';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('PEXEL_API_KEY');
  }

  async getVideoUrl(selectWidth: number, selectHeight: number) {
    const searchUrl = `${this.baseUrl}?query=nature&per_page=1&locale=en-US&size=small`;

    const response = await axios.get(searchUrl, {
      headers: {
        Authorization: this.apiKey,
      },
    });

    if (!response.data) {
      this.logger.error('No data found');
      throw new Error('No data found');
    }

    const { total_results } = response.data;
    const radomIndex = Math.floor(Math.random() * total_results) + 1;

    const retrySearchUrl = `${this.baseUrl}?query=nature&per_page=1&locale=en-US&size=small&page=${radomIndex}`;
    const retryResponse = await axios.get(retrySearchUrl, {
      headers: {
        Authorization: this.apiKey,
      },
    });

    if (!retryResponse.data) {
      this.logger.error('No data found');
      throw new Error('Retry: No data found');
    }

    const { videos } = retryResponse.data;
    const { video_files } = videos[0];

    if (video_files.length === 0) {
      this.logger.error('No video files found');
      throw new Error('No video files found');
    }

    let videoUrl = video_files[0].link;
    video_files.forEach((video) => {
      const { link, width, height } = video;
      if (width === selectWidth && height === selectHeight) {
        videoUrl = link;
      }
    });

    this.logger.log(
      `Video URL: ${videoUrl} / ${selectWidth}x${selectHeight} / ${total_results} / ${radomIndex}`,
    );

    return videoUrl;
  }

  async calculatePoint() {
    return new Promise<number>((resolve) => {
      setTimeout(() => {
        resolve(100);
      }, 1000);
    });
  }
}
