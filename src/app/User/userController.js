const jwtMiddleware = require("../../../config/jwtMiddleware");
const userProvider = require("../../app/User/userProvider");
const userService = require("../../app/User/userService");
const baseResponse = require("../../../config/baseResponseStatus");
const {response, errResponse} = require("../../../config/response");
const yearNow = require("date-utils");
const regexEmail = require("regex-email");
const s3Client = require("../../../config/s3");
const AWS = require('aws-sdk');

/**
 * API No. 0
 * API Name : 테스트 API
 * [GET] /app/test
 */
exports.getTest = async function (req, res) {
    return res.send(response(baseResponse.SUCCESS))
}

/**
 * API No. 3
 * API Name : 로그인 API
 * [POST] /app/users/login
 * body : email, identification
 */
exports.login = async function (req, res) {

    const { email, identification } = req.body;

    const signInResponse = await userService.postSignIn(email, identification);
    
    return res.send(signInResponse);
}


/**
 * API No. 4
 * API Name : 유저 생성 (회원가입) API
 * [POST] /app/users
 *body: nickname, birthYear, gender, type, email, identification
 */
exports.postUsers = async function (req, res) {
 
    const {nickname, birthYear, gender, type, email, identification} = req.body;

    // 빈 값 체크
    if (!email) return res.send(response(baseResponse.USER_EMAIL_EMPTY));
    if (!identification) return res.send(response(baseResponse.USER_IDENTIFICATION_EMPTY));
    if (!nickname) return res.send(response(baseResponse.SIGNIN_USER_NICKNAME_EMPTY));
    if (!birthYear) return res.send(response(baseResponse.USER_BIRTHYEAR_EMPTY));
    if (!gender) return res.send(response(baseResponse.USER_GENDER_EMPTY));
    if (!type) return res.send(response(baseResponse.USER_TYPE_EMPTY));

    //길이 체크
    if (nickname.length > 20) return res.send(response(baseResponse.SIGNUP_NICKNAME_LENGTH));

    // 형식 체크 (by 정규표현식)
    if (!regexEmail.test(email))
        return res.send(response(baseResponse.SIGNUP_EMAIL_ERROR_TYPE));

    const checkUser = await userProvider.checkUserExist(email, identification);
    if (checkUser.length > 0) {
        return res.send(response(baseResponse.SIGNUP_USER_EXISTS));
    }

    // 회원가입 처리
    const signUpResponse = await userService.createUser(
        nickname,
        birthYear,
        gender,
        type,
        email,
        identification
    );

    // signUpResponse 값을 json으로 전달
    return res.send(signUpResponse);
};


/**
 * API No. 5
 * API Name : 회원 정보 수정 API + JWT + Validation
 * [PATCH] /app/users/:userIdx
 * path variable : userIdx
 * body : nickname, birthYear, gender, setAge
 */
exports.patchUsers = async function (req, res) {

    const userIdFromJWT = req.verifiedToken.userIdx;

    const userIdx = req.params.userIdx;
    const {nickname, birthYear, gender, setAge} = req.body;
    const today = new Date();
    console.log(userIdx)
    console.log(userIdFromJWT)
    if (userIdFromJWT != userIdx) return res.send(errResponse(baseResponse.USER_ID_NOT_MATCH));

    // 빈 값 체크
    if (!nickname) return res.send(errResponse(baseResponse.USER_NICKNAME_EMPTY));
    if (nickname.length > 20) return res.send(response(baseResponse.SIGNUP_NICKNAME_LENGTH));
    if (!birthYear) return res.send(response(baseResponse.USER_BIRTHYEAR_EMPTY));
    if (!gender) return res.send(response(baseResponse.USER_GENDER_EMPTY));
    if (!setAge) return res.send(response(baseResponse.USER_SETAGE_EMPTY));

    //1900~올해까지만 유저 생성
    let year = Number(birthYear);
    if (year <= 1900 || year >= today.getFullYear()) return res.send(errResponse(baseResponse.USER_BIRTHYEAR_TIME_WRONG));
    if (!(gender === 'M' || gender === 'F' || gender === 'N')) return res.send(errResponse(baseResponse.USER_GENDER_WRONG));
    if (!(setAge === 'T' || setAge === 'F')) return res.send(errResponse(baseResponse.USER_SETAGE_WRONG));

    const editUserInfo = await userService.editUser(nickname, birthYear, gender, setAge, userIdx);
    return res.send(editUserInfo);

};


/**
 * API No. 6
 * API Name : 특정 유저 조회 API
 * [GET] /app/users/:userIdx
 * Path Variable: userIdx
 */
exports.getUserById = async function (req, res) {

    const userIdFromJWT = req.verifiedToken.userIdx;

    const userIdx = req.params.userIdx;

    if (userIdFromJWT != userIdx) {
        res.send(errResponse(baseResponse.USER_ID_NOT_MATCH));
    } else {
        const userByUserIdx = await userProvider.userIdCheck(userIdx);
        return res.send(response(baseResponse.SUCCESS, userByUserIdx[0]));
    }
};


/**
 * API No. 7
 * API Name : 탈퇴하기 API
 * [PATCH] /app/users/:userIdx/status
 * Path Variable : userIdx, status
 */
exports.patchUsersStatus = async function (req, res) {

    const userIdFromJWT = req.verifiedToken.userIdx;

    const userIdx = req.params.userIdx;

    if (userIdFromJWT != userIdx) {
        res.send(errResponse(baseResponse.USER_ID_NOT_MATCH));
    } else {
        const editUserStatus = await userService.editUserStatus(userIdx);
        return res.send(editUserStatus);
    }

};

/**
 * API No. 9
 * API Name : 받은 일기 알림 설정
 * [PATCH] /app/users/:userIdx/push/diary
 * path variable : userIdx, diary
 * body : diaryPush
 */
exports.patchDiaryPush = async function (req, res) {

    const userIdFromJWT = req.verifiedToken.userIdx;

    const userIdx = req.params.userIdx;
    const diaryPush = req.body.diaryPush;

    if (userIdFromJWT != userIdx) {
        res.send(errResponse(baseResponse.USER_ID_NOT_MATCH));
    } else {
        if (!diaryPush) return res.send(errResponse(baseResponse.USER_DIARY_PUSH_EMPTY));
        if (!userIdx) return res.send(errResponse(baseResponse.USER_USERID_EMPTY));
        if (!(diaryPush == 'T' || diaryPush == 'F')) return res.send(errResponse(baseResponse.PUSH_DIARY_WRONG));

        const editDiaryPush = await userService.editDiaryPush(userIdx, diaryPush);
        return res.send(editDiaryPush);
    }
};

/** API No. 10
 * API Name : 받은 답장 알림 설정
 * [PATCH] /app/users/:userIdx/push/answer
 * path variable : userIdx, answer
 * body : diaryPush
 */
exports.patchPushAnswer = async function (req, res) {

    const userIdFromJWT = req.verifiedToken.userIdx;

    const userIdx = req.params.userIdx;
    const answerPush = req.body.answerPush;

    if (userIdFromJWT != userIdx) {
        res.send(errResponse(baseResponse.USER_ID_NOT_MATCH));
    } else {
        if (!answerPush) return res.send(errResponse(baseResponse.USER_ANSWER_PUSH_EMPTY));
        if (!userIdx) return res.send(errResponse(baseResponse.USER_USERID_EMPTY));
        if (!(answerPush == 'T' || answerPush == 'F')) return res.send(errResponse(baseResponse.PUSH_ANSWER_WRONG));

        const editAnswerPush = await userService.editAnswerPush(userIdx, answerPush);
        return res.send(editAnswerPush);
    }
};

/** API No. 11
 * API Name : 받은 채팅 알림 설정
 * [PATCH] /app/users/:userIdx/push/chat
 * path variable : userIdx, chat
 * body : chatPush
 */
exports.patchPushChat = async function (req, res) {

    const userIdFromJWT = req.verifiedToken.userIdx;

    const userIdx = req.params.userIdx;
    const chatPush = req.body.chatPush;

    if (userIdFromJWT != userIdx) {
        res.send(errResponse(baseResponse.USER_ID_NOT_MATCH));
    } else {
        if (!chatPush) return res.send(errResponse(baseResponse.USER_CHAT_PUSH_EMPTY));
        if (!userIdx) return res.send(errResponse(baseResponse.USER_USERID_EMPTY));
        if (!(chatPush == 'T' || chatPush == 'F')) return res.send(errResponse(baseResponse.PUSH_CHAT_WRONG));

        const editChatPush = await userService.editChatPush(userIdx, chatPush);
        return res.send(editChatPush);
    }

};

/**
 * API No. 25
 * API Name : 유저 프로필 사진 업로드(수정) API
 * [PATCH] /app/users/:userIdx/profile
 */
exports.patchProfImg = async function (req, res) {

    //const userIdx = 1;
    const userIdx = req.params.userIdx;
    const userIdFromJWT = req.verifiedToken.userIdx;

    console.log('userIdx: ' + userIdx)
    if (userIdFromJWT != userIdx) res.send(errResponse(baseResponse.USER_ID_NOT_MATCH));

    const file = req.files;
    console.log(file);


    if (!req.files) {
        console.log('no file');
        return res.send(errResponse(baseResponse.USER_PROFIMG_EMPTY));
    }
    // 파일 잇는 경우
    else {
        const img = req.files.profImg;
        console.log(img)
        let bucketName = 'gonggangam-bucket'

        const s3 = new AWS.S3({
            accessKeyId: s3Client.accessid,
            secretAccessKey: s3Client.secret,
            region: 'ap-northeast-2',
            Bucket: bucketName
        });

        const params = {
            Bucket: 'gonggangam-bucket',
            Key: img.name,
            Body: img.data
        };
        s3.upload(params, async function(err, data) {
            if (err) {
                //throw err;
                console.log('error')
                console.log(err)
                return res.send(errResponse(baseResponse.DIARY_S3_ERROR));
            } else {
                console.log(`File uploaded successfully.`);
                console.log(data.Location)
                const updateResponse = await userService.updateUserImg(userIdx, data.Location);
                return res.send(updateResponse);

            }
        });
    }
};