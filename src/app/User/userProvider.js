const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");

const userDao = require("./userDao");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Provider: Read 비즈니스 로직 처리


exports.retrieveUser = async function (userIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const userResult = await userDao.selectUserId(connection, userIdx);
  connection.release();

  return userResult[0];
};

exports.userNicknameCheck = async function (nickname) {
  const connection = await pool.getConnection(async (conn) => conn);
  const nicknameCheckResult = await userDao.selectUserNickname(connection, nickname);
  connection.release();

  return nicknameCheckResult;
};

exports.userIdCheck = async function (userIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const idCheckResult = await userDao.selectUserId(connection, userIdx);

  return idCheckResult;
};

exports.accountCheck = async function (email) {
  const connection = await pool.getConnection(async (conn) => conn);
  const userAccountResult = await userDao.selectUserAccount(connection, email);
  connection.release();

  return userAccountResult;
};

exports.checkUserExist = async function (email, identification) {
  const connection = await pool.getConnection(async (conn) => conn);
  const userCheckResult = await userDao.selectUserCheck(connection, email, identification);
  connection.release();

  return userCheckResult;
};


exports.userEmailCheck = async function (email) {
  const connection = await pool.getConnection(async (conn) => conn);
  const emailCheckResult = await userDao.selectUserEmail(connection, email);
  connection.release();

  return emailCheckResult;
};


exports.userIdentificationCheck = async function (selectEmail) {
  const connection = await pool.getConnection(async (conn) => conn);
  const identificationCheckResult = await userDao.selectUserIdentification(connection, selectEmail);
  connection.release();

  return identificationCheckResult;
};
