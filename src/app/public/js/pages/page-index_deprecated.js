// window.onload = function () {
document.addEventListener('DOMContentLoaded', () => {
    let videoPublicUrl = '';
    const videoElement = document.getElementById('my-video');
    const captureButton = document.getElementById('capture-button');
    const screenshotImage = document.getElementById('screenshot-image');
    const player = videojs(videoElement);

    function captureScreenshot() {
        const canvasTmp = document.getElementById('screenshot-canvas');
        const context = canvasTmp.getContext('2d');
        canvasTmp.width = videoElement.videoWidth;
        canvasTmp.height = videoElement.videoHeight;
        context.drawImage(videoElement, 0, 0, canvasTmp.width, canvasTmp.height);
        const dataURL = canvasTmp.toDataURL('image/png');
        screenshotImage.src = dataURL;
    }
    player.on('pause', captureScreenshot);
    player.on('seeked', captureScreenshot);

    captureButton.addEventListener('click', captureScreenshot);

    document.getElementById('video-file').addEventListener('change', async (event) => {
        const file = event.target.files[0];

        if (!file) {
            alert('Please select a file');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const start = Date.now();

        document.getElementById('quality').textContent = `Loading...`;
        document.getElementById('format').textContent = `Loading...`;
        document.getElementById('duration').textContent = `Loading...`;
        document.getElementById('response-time').textContent = `Loading...`;

        const result = await apiService.requestPostApi("/api/v1/video/metadata_file", formData, {
            "Content-Type": "multipart/form-data"
        }, false);

        if (result.retCode === 0) {
            const end = Date.now();

            const { publicUrl, metaData } = result.data
            const { streams, format } = metaData;
            player.src(constants.BASE_URL + publicUrl);
            videoPublicUrl = publicUrl;
            const width = streams[0].coded_width;
            const height = streams[0].coded_height;
            document.getElementById('quality').textContent = `${width} x ${height}`
            document.getElementById('format').textContent = streams[1].codec_tag_string;
            document.getElementById('duration').textContent = streams[1].duration;
            document.getElementById('response-time').textContent = end - start + ' ms';
        } else {
            alert('Error: ' + result.data.msg);
        }

    });

    document.getElementById("upload-video-button").addEventListener('click', async () => {
        const url = document.getElementById("video-url").value

        if (!url) {
            alert('Please enter a URL');
            return;
        }
        const start = Date.now();

        document.getElementById('quality').textContent = `Loading...`;
        document.getElementById('format').textContent = `Loading...`;
        document.getElementById('duration').textContent = `Loading...`;
        document.getElementById('response-time').textContent = `Loading...`;

        const result = await apiService.requestPostApi("/api/v1/video/metadata_url", { url }, {
            "Content-Type": "application/json"
        }, false);

        if (result.retCode === 0) {
            const end = Date.now();

            const { publicUrl, metaData } = result.data
            const { streams, format } = metaData;
            player.src(constants.BASE_URL + publicUrl);
            videoPublicUrl = publicUrl;
            const width = streams[0].coded_width;
            const height = streams[0].coded_height;
            document.getElementById('quality').textContent = `${width} x ${height}`
            document.getElementById('format').textContent = streams[1].codec_tag_string;
            document.getElementById('duration').textContent = streams[1].duration;
            document.getElementById('response-time').textContent = end - start + ' ms';

        } else {
            alert('Error: ' + result.data.msg);
        }

    });

    document.getElementById("upload-button").addEventListener('click', async () => {
        const title = document.getElementById("title").value
        const description = document.getElementById("description").value

        if (!title || !description) {
            alert('Please enter title and description');
            return;
        }

        const result = await apiService.requestPostApi("/api/v1/video/upload", {
            title,
            description,
            base64Image: screenshotImage.src,
            videoUrl: videoPublicUrl || player.src()
        }, {
            "Content-Type": "application/json"
        }, false);

        if (result.retCode === 0) {
            alert('Upload success! \n Go To Marketplace to see your video');
        } else {
            alert('Error: ' + result.data.msg);
        }
    })
});
