// --------------------------------- UI COMMON SERVICE --------------------------------------------

/**
 * create Element
 * @param {*} tagName "div"
 * @param {*} attributes {id: "id", class: "class",style: "style"}
 * @returns HTMLElement 
 */
function createElementFunc(tagName, attributes = {}) {
    const element = document.createElement(tagName);
    for (let key in attributes) {
        element.setAttribute(key, attributes[key]);
    }
    return element;
}

// check input box is empty and focus
function isEmptyInputBox(inputBoxId) {
    const inputBox = document.getElementById(inputBoxId);
    if (inputBox.value === "") {
        inputBox.focus();
        return true;
    }
    return false;
}

// check userName
function isValidUserName(inputString) {
    // 정규표현식을 사용하여 문자, 숫자, 밑줄만 포함하는지 확인
    const pattern = /^[a-zA-Z0-9_]+$/;
    return pattern.test(inputString);
}

// check form data is empty
function isEmptyFormData(formData, includeKey = []) {
    let checkEmpty = false;

    for (let key of formData.keys()) {
        if (includeKey.includes(key)) {
            if (formData.get(key).trim() === "") {
                checkEmpty = true;
            }
        }
    }

    return checkEmpty;
}

// --------------------------------- VALIDATION SERVICE --------------------------------------------
// check Number is valid
function isValidNumber(number) {
    const numberRegex = /^[0-9]*$/;
    return numberRegex.test(number);
}

// check email is valid
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// check youtube url is valid
function isValidYoutubeUrl(url) {
    const youtubeRegex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
}

function extractYoutubeVideoId(url) {
    const youtubeRegex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    if (youtubeRegex.test(url)) {
        const youtubeUrl = new URL(url);
        const youtubeVideoId = youtubeUrl.searchParams.get("v");
        if (!youtubeVideoId) {
            const regex =
                /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

            const match = url.match(regex);

            return match ? match[1] : null;
        }
        return youtubeVideoId;
    }
    return null;
}

function extractYoutubeVideoTime(url) {
    const regex = /(?:\?|&)t=([0-9hms]+)/;
    const match = url.match(regex);

    return match ? match[1] : 0;
}

// check url is valid
function isValidUrl(url) {
    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
    return urlRegex.test(url);
}

// --------------------------------- CACHE SERVICE --------------------------------------------
// cookie 관련 method
// cookie 모두 조회, 삭제 기능 추가
const customCookieStore = {
    // cookie 조회
    getCookie(name) {
        const value = "; " + document.cookie;
        const parts = value.split("; " + name + "=");
        if (parts.length == 2) {
            return parts.pop().split(";").shift();
        }
        return null
    },

    // cookie 모두 조회
    getCookieAll() {
        const value = "; " + document.cookie;
        const parts = value.split("; ");
        const cookieObj = {};
        for (let i = 0; i < parts.length; i++) {
            const cookie = parts[i].split("=");
            cookieObj[cookie[0]] = cookie[1];
        }
        return cookieObj;
    },

    // cookie 설정
    setCookie(name, value) {
        const date = new Date();
        date.setTime(date.getTime() + constants.COOKIE_EXPIRE);
        document.cookie = name + "=" + value + ";expires=" + date.toUTCString() + ";path=/";
    },

    // cookie 모두 삭제
    deleteAllCookie() {
        const cookies = document.cookie.split(";");

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
    },

    // cookie 삭제
    deleteCookie(name) {
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
}

// localStorage 관련 method
const localStorageStore = {
    setLocalStorage(key, value) {
        localStorage.setItem(key, value);
    },

    getLocalStorage(key) {
        return localStorage.getItem(key);
    },

    deleteLocalStorage(key) {
        localStorage.removeItem(key);
    }
}

window.createElementFunc = createElementFunc;
window.isEmptyInputBox = isEmptyInputBox;
window.isValidUserName = isValidUserName;
window.isEmptyFormData = isEmptyFormData;

window.isValidNumber = isValidNumber;
window.isValidEmail = isValidEmail;
window.isValidYoutubeUrl = isValidYoutubeUrl;
window.extractYoutubeVideoId = extractYoutubeVideoId;
window.extractYoutubeVideoTime = extractYoutubeVideoTime;
window.isValidUrl = isValidUrl;

window.customCookieStore = customCookieStore;
window.localStorageStore = localStorageStore;