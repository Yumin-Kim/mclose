/* eslint-disable */

/**
 * GET 
 * - headers : mt-app-token
 * POST / PUT / DELETE
 * - headers : mt-app-token , mt-sig , mt-nonce
 */
class ApiService {
    axios = null;
    BASEURL = null;
    /**
     * 
     * @param {*} axiosInstance  window.axios
     */
    constructor(axiosInstance) {
        this.axios = axiosInstance;
        this.BASEURL = constants.BASE_URL;
        // this.BASEURL = constants.PROD_BASE_URL;
    }

    /**
     * GET API 호출
     * @param {*} url /api/v1/...
     * @param {*} queryStringObj {key : value}
     * @param {*} headers {key : value}
     * @param {*} isToken token 값이 필요한지 여부
     * @returns 
     */
    async requestGetApi(url, queryStringObj = null, headers, isToken = false) {
        try {

            if (!headers) {
                headers = {};
                headers['Content-Type'] = 'application/json';
            }

            // cookie 값을 가져와서 헤더에 추가
            if (isToken) {
                const jwtInfo = authService.getJwtCookie();

                if (jwtInfo) {
                    headers[constants.MT_TOKEN_NAME] = jwtInfo;
                } else {

                }
            }

            // 쿼리스트링 생성
            if (queryStringObj) {
                url += "?";
                for (const key in queryStringObj) {
                    url += key + "=" + queryStringObj[key] + "&";
                }
                url = url.slice(0, -1);
            }

            const response = await this.axios.get(this.BASEURL + url, {
                headers
            });

            if (response.data.retCode === 0) {
                return response.data;
            } else {
                throw new Error(response);
            }
        } catch (error) {
            console.log(error);
            // showToastAlertComponent("[GET] Error... check console", 1000, true, false);
            return null;
        }
    }

    /**
     * 
     * @param {*} url /api/v1/...
     * @param {*} bodyObj {key : value}
     * @param {*} headers {key : value}
     * @returns 
     */
    async requestPostApi(url, bodyObj, headers = null, isToken = false) {
        try {
            console.log(url, bodyObj);
            const nonce = Date.now();

            if (!headers) {
                headers = {};
                headers['Content-Type'] = 'application/json';
            }

            if (isToken) {
                // cookie 값을 가져와서 헤더에 추가
                const jwtInfo = authService.getJwtCookie();

                if (jwtInfo) {
                    headers[constants.MT_TOKEN_NAME] = jwtInfo;
                } else {
                    console.log("jwt is null");
                    return null;
                }

                // bodyObj를 JSON String으로 변환   
                const sig = authService.generateSignature(constants.MT_API_KEY, bodyObj, nonce);
                if (!sig) {
                    console.log("sig is null");
                    return null;
                }

                headers[constants.MT_SIG_NAME] = sig;
                headers[constants.MT_NONCE_NAME] = nonce;
            }

            const response = await this.axios.post(this.BASEURL + url, bodyObj, {
                headers
            });

            if (response.data.retCode === 0) {
                return response.data;
            } else {
                throw new Error(response);
            }
        } catch (error) {
            // 사용자 정의 에러 발생
            // showToastAlertComponent("[POST] Error... check console", 1000, true, false);
            console.log(error);

            // error.reponse.data.message : 에러 메시지
            if (error && error.response && error.response.data) {
                return error.response.data;
            } else {
            }
            return null;
        }
    }

    /**
     * 
     * @param {*} url /api/v1/...
     * @param {*} bodyObj {key : value}
     * @param {*} headers {key : value}
     * @returns 
     */
    async requestPutApi(url, bodyObj, headers = null, isToken = false) {
        try {
            const nonce = Date.now();

            if (!headers) {
                headers = {};
                headers['Content-Type'] = 'application/json';
            }

            if (isToken) {
                // cookie 값을 가져와서 헤더에 추가
                const jwtInfo = authService.getJwtCookie();

                if (jwtInfo) {
                    headers[constants.MT_TOKEN_NAME] = jwtInfo;
                } else {
                    console.log("jwt is null");
                }

                // bodyObj를 JSON String으로 변환   
                const sig = authService.generateSignature(constants.MT_API_KEY, bodyObj, nonce);
                if (!sig) {
                    console.log("sig is null");
                    return null;
                }

                headers[constants.MT_SIG_NAME] = sig;
                headers[constants.MT_NONCE_NAME] = nonce;
            }

            const response = await this.axios.put(this.BASEURL + url, bodyObj, {
                headers
            });

            if (response.data.retCode === 0) {
                return response.data;
            } else {
                throw new Error(response);
            }
        } catch (error) {
            // 사용자 정의 에러 발생
            // error.reponse.data.message : 에러 메시지
            // showToastAlertComponent("[PUT] Error... check console", 1000, true, false);

            if (error && error.response && error.response.data) {
                return error.response.data;
            } else {
                console.log(error);
            }
            return null;
        }
    }

    /**
     * 
     * @param {*} url /api/v1/...
     * @param {*} bodyObj {key : value}
     * @param {*} headers {key : value}
     * @returns 
     */
    async requestDeleteApi(url, bodyObj, headers = null, isToken = false) {
        try {
            const nonce = Date.now();

            if (!headers) {
                headers = {};
                headers['Content-Type'] = 'application/json';
            }

            if (isToken) {
                // cookie 값을 가져와서 헤더에 추가
                const jwtInfo = authService.getJwtCookie();

                console.log("jwtInfo", jwtInfo);

                if (jwtInfo) {
                    headers[constants.MT_TOKEN_NAME] = jwtInfo;
                } else {
                    console.log("jwt is null");
                    return null;
                }

                // bodyObj를 JSON String으로 변환   
                const sig = authService.generateSignature(constants.MT_API_KEY, bodyObj, nonce);
                if (!sig) {
                    console.log("sig is null");
                    return null;
                }

                headers[constants.MT_SIG_NAME] = sig;
                headers[constants.MT_NONCE_NAME] = nonce;
            }

            console.log("requestDeleteApi", headers);

            const response = await this.axios.delete(this.BASEURL + url, {
                headers,
                data: bodyObj
            },);


            if (response.data.retCode === 0) {
                return response.data;
            } else {
                throw new Error(response);
            }
        } catch (error) {
            // 사용자 정의 에러 발생
            // error.reponse.data.message : 에러 메시지
            // showToastAlertComponent("[DELETE] Error... check console", 1000, true, false);
            if (error && error.response && error.response.data) {
                return error.response.data;
            } else {
                console.log(error);
            }
            return null;
        }
    }


}


// ApiService 인스턴스 생성
const apiService = new ApiService(window.axios);

window.apiService = apiService;