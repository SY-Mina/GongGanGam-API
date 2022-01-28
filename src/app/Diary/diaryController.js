const jwtMiddleware = require("../../../config/jwtMiddleware");
const diaryProvider = require("../../app/Diary/diaryProvider");
const diaryService = require("../../app/Diary/diaryService");
const baseResponse = require("../../../config/baseResponseStatus");
const {response, errResponse} = require("../../../config/response");
const s3Client = require("../../../config/s3");
const AWS = require('aws-sdk');

const formidable = require('formidable')
const fs = require('fs');

/**
 * API No. 12
 * API Name : 받은 일기 리스트 조회 API
 * [GET] /app/diarys/share?page=
 */
exports.getSharedDiarys = async function (req, res) {

    const userIdx = 1;
    // 페이징 처리 (테스트 용으로 페이지 사이즈 3)
    let page = req.query.page;
    if (!page) page = 1;
    console.log('page Num:' + page);
    const pageSize = 3;
    let pageNum = Number(page);
    const offset = pageSize * pageNum - pageSize;
    console.log('pageNum: ' + pageNum);
    console.log('offset: ' + offset);

    if (offset<0) return res.send(errResponse(baseResponse.PAGE_INVALID));

    const shareDiary = await diaryProvider.retrieveAllShared(userIdx);
    console.log(shareDiary);
    if (shareDiary.length < offset) return res.send(errResponse(baseResponse.PAGE_INVALID_END));
    const totalPage = Math.ceil(shareDiary.length/pageSize);
    console.log('totalPage: ' + totalPage);


    const sharedDiaryResult = await diaryProvider.retrieveSharedDiaryList(userIdx, pageSize, offset);

    const pageInfo = {"curPage" : parseInt(page), "totalPage" : totalPage, "pageSize" : pageSize};
    const result = {"page" : pageInfo, "diarys":sharedDiaryResult};
    return res.send(response(baseResponse.SUCCESS, result));

};

/**
 * API No. 13
 * API Name : 받은 답장 리스트 조회 API
 * [GET] /app/diarys/answer?page=
 */
exports.getAnswerList = async function (req, res) {
    const userIdx = 1;

    // 페이징 처리 (테스트 용으로 페이지 사이즈 3)
    let page = req.query.page;
    if (!page) page = 1;
    console.log('page Num:' + page);
    const pageSize = 3;
    let pageNum = Number(page);
    const offset = pageSize * pageNum - pageSize;
    console.log('pageNum: ' + pageNum);
    console.log('offset: ' + offset);

    if (offset<0) return res.send(errResponse(baseResponse.PAGE_INVALID));

    const answers = await diaryProvider.retrieveAllAnswer(userIdx);
    console.log(answers);
    console.log('length:' + answers.length);
    if (answers.length < offset) return res.send(errResponse(baseResponse.PAGE_INVALID_END));
    const totalPage = Math.ceil(answers.length/pageSize);
    console.log('totalPage: ' + totalPage);

    const answerResult = await diaryProvider.retrieveAnswerList(userIdx, pageSize, offset);

    const pageInfo = {"curPage" : parseInt(page), "totalPage" : totalPage, "pageSize" : pageSize};
    const result = {"page" : pageInfo, "answers":answerResult};
    return res.send(response(baseResponse.SUCCESS, result));

};

/**
 * API No. 14
 * API Name : 받은 일기 조회 API
 * [GET] /app/diarys/share/:diaryIdx?page=
 */
exports.getSharedDiaryDetail = async function (req, res) {

    const diaryIdx = req.params.diaryIdx;

    if (!diaryIdx) return res.send(errResponse(baseResponse.DIARY_DIARYIDX_EMPTY));

    const sharedDiaryResult = await diaryProvider.retrieveSharedDiary(diaryIdx);
    if (sharedDiaryResult.length<1) return res.send(errResponse(baseResponse.DIARY_DIARYIDX_NOT_EXIST));
    return res.send(response(baseResponse.SUCCESS, sharedDiaryResult));

};

/**
 * API No. 15
 * API Name : 받은 답장 조회 API
 * [GET] /app/diarys/answer/:diaryIdx
 */
exports.getAnswer = async function (req, res) {

    const diaryIdx = req.params.diaryIdx;
    const userIdx = 1;

    if (!diaryIdx) return res.send(errResponse(baseResponse.DIARY_DIARYIDX_EMPTY));
    // 존재하지 않는 유저인지 확인
    const userCheckResult = await diaryProvider.checkUser(userIdx);
    if (userCheckResult.length<1) return res.send(errResponse(baseResponse.USER_NOT_EXIST));
    // 존재하지 않는 다이어리인지 확인
    const diaryCheckResult = await diaryProvider.checkDiary(diaryIdx);
    if (diaryCheckResult.length<1) return res.send(errResponse(baseResponse.DIARY_DIARYIDX_NOT_EXIST));
    // 다이어리의 접근하는 유저인지 확인?
    // if (diaryCheckResult[0].userIdx !== userIdx) return res.send(errResponse(baseResponse.ANSWER_USERIDX_INVALID));

    const answerResult = await diaryProvider.retrieveAnswer(diaryIdx, userIdx);

    if (answerResult.answer.length <1) return res.send(errResponse(baseResponse.ANSWER_DIARY_NOT_EXIST));
    return res.send(response(baseResponse.SUCCESS, answerResult));

};

/**
 * API No. 16
 * API Name : 나의 다이어리 조회(캘린더 - 이모티콘) API
 * [GET] /app/diary?year=&month=
 */
exports.getDiarys = async function (req, res) {

    /**
     * Query String: year, month
     */
    const year = req.query.year;
    const month = req.query.month;

    if (!year) return res.send(errResponse(baseResponse.DIARY_YEAR_EMPTY));
    if (!month) return res.send(errResponse(baseResponse.DIARY_MONTH_EMPTY));


    const monthDiaryResult = await diaryProvider.retrieveMonthList(year, month);
    return res.send(response(baseResponse.SUCCESS, monthDiaryResult));

};


/**
 * API No. 17
 * API Name : 그날의 다이어리 조회 API
 * [GET] /app/diary/detail?year=&month=&day=
 */
exports.getDiaryDetail = async function (req, res) {

    /**
     * Query String: year, month, day
     */
    const year = req.query.year;
    const month = req.query.month;
    const day = req.query.day;

    if (!year) return res.send(errResponse(baseResponse.DIARY_YEAR_EMPTY));
    if (!month) return res.send(errResponse(baseResponse.DIARY_MONTH_EMPTY));
    if (!day) return res.send(errResponse(baseResponse.DIARY_DAY_EMPTY));

    const diaryResult = await diaryProvider.retrieveDiary(year, month, day);
    return res.send(response(baseResponse.SUCCESS, diaryResult));

};

/**
 * API No. 18
 * API Name : 다이어리 쓰기 &공유하기 API
 * [POST] /app/diarys
 */
exports.postDiary = async function (req, res) {

    /**
     * Body: emoji, date, content, shareAgree
     */

    const {emoji, year, month, day, content, shareAgree} = req.body;
    const file = req.files;
    console.log(file);

    const userIdx = 1;

    if (!year) return res.send(errResponse(baseResponse.DIARY_YEAR_EMPTY));
    if (!month) return res.send(errResponse(baseResponse.DIARY_MONTH_EMPTY));
    if (!day) return res.send(errResponse(baseResponse.DIARY_DAY_EMPTY));

    let date = year;

    if (month < 10) {
        date = date + '-0' +month;
        if (day < 10) date = date + '-0' + day;
        else date = date + '-' + day;
    } else {
        date = date + '-' + month;
        if (day < 10) date = date + '-0' + day;
        else date = date + '-' + day;
    }
    console.log(date);

    // 파일 없으면 파일 없이 그냥 업로드
    if (!req.files) {
        console.log('no file');
        const postdiaryResponse = await diaryService.createDiary(userIdx, date, emoji, content, shareAgree);
        return res.send(postdiaryResponse);
    }
    else {
        const img = req.files.uploadImg;
        console.log(img)
        var bucketName = 'usermodel'

        const s3 = new AWS.S3({
            accessKeyId: s3Client.accessid,
            secretAccessKey: s3Client.secret,
            region: 'ap-northeast-2',
            Bucket: bucketName
        });

        const params = {
            Bucket: 'usermodel',
            Key: img.name,
            Body: img.data
        };
        s3.upload(params, function(err, data) {
            if (err) {
                //throw err;
                console.log('error')
                console.log(err)
                return res.send(errResponse(baseResponse.DIARY_S3_ERROR));
            } else {
                console.log(`File uploaded successfully.`);
                console.log(data.Location)
                const diaryResponse = diaryService.createDiaryImg(userIdx, date, emoji, content, shareAgree, data.Location);
                //return res.send(diaryResponse);
                return res.send(response(baseResponse.SUCCESS));

            }
        });
    }
};

/**
 * API No. 10
 * API Name : 다이어리 답장하기 API
 * [POST] /app/diarys/answer
 */
exports.postAnswer = async function (req, res) {

    /**
     * Body: content, diaryIdx
     */

    const {content, diaryIdx} = req.body;

    const userIdx = 1;

    const postAnswerResponse = await diaryService.createAnswer(userIdx, diaryIdx, content);
    return res.send(postAnswerResponse);

};

/**
 * API No. 20
 * API Name : 다이어리 삭제하기 API
 * [POST] /app/diarys/:diaryIdx/status
 */
exports.patchDiaryStatus = async function (req, res) {

    /**
     * Body: emoji, date, content, shareAgree
     */

    const diaryIdx = req.params.diaryIdx;
    const userIdx = 1;

    const patchdiaryResponse = await diaryService.updateDiaryStatus(userIdx, diaryIdx);
    return res.send(patchdiaryResponse);

};

/**
 * API No. 21
 * API Name : 다이어리 수정하기 API
 * [POST] /app/diarys/:diaryIdx
 */
exports.patchDiary = async function (req, res) {

    /**
     * Body: emoji, date, content, shareAgree
     */

    const diaryIdx = req.params.diaryIdx;
    const {emoji, year, month, day, content, shareAgree} = req.body;

    if (!year) return res.send(errResponse(baseResponse.DIARY_YEAR_EMPTY));
    if (!month) return res.send(errResponse(baseResponse.DIARY_MONTH_EMPTY));
    if (!day) return res.send(errResponse(baseResponse.DIARY_DAY_EMPTY));

    let date = year;

    if (month < 10) {
        date = date + '-0' +month;
        if (day < 10) date = date + '-0' + day;
        else date = date + '-' + day;
    } else {
        date = date + '-' + month;
        if (day < 10) date = date + '-0' + day;
        else date = date + '-' + day;
    }
    const userIdx = 1;

    const patchdiaryResponse = await diaryService.updateDiary(diaryIdx, userIdx, date, emoji, content, shareAgree);
    return res.send(patchdiaryResponse);

};