import request from 'superagent';

export const startChatApi = (userId, options) => request
    .post(`/users/${ userId }/chats?ng=true`)
    .set('Accept', 'application/json')
    .send(options);

export const updateBuyerInfoApi = (
  id, userId, login, password, over, payment, userFromEU, privacy, buyerNickName
) => request
  .put(`/users/${ userId }/chats/${ id }`)
  .set('Accept', 'application/json')
  .send({ ng: true,
    login,
    password,
    over,
    payment,
    user_from_eu: userFromEU,
    privacy,
    buyer_nick_name: buyerNickName });

export const beaconHangupApi = (id, userId) =>
  window.navigator.sendBeacon(
    `/users/${ userId }/chats/${ id }/hangup?ng=true&reason=tab_closed`
  );

export const hangupChatApi = (id, userId, opts = {}) => request
  .post(`/users/${ userId }/chats/${ id }/hangup`)
  .set('Accept', 'application/json')
  .send({ ...opts, ng: true });

export const requestChargeApi = (id, userId, auto) => request
  .post(`/users/${ userId }/chats/${ id }/request_charge`)
  .set('Accept', 'application/json')
  .send({ ng: true, auto });

export const requestCreditApi = (id, userId) => request
  .post(`/users/${ userId }/chats/${ id }/request_buyer_credit`)
  .set('Accept', 'application/json')
  .send({ ng: true });

export const requestCheckApi = (id, userId, amount) => request
  .post(`/users/${ userId }/chats/${ id }/request_check`)
  .set('Accept', 'application/json')
  .send({ ng: true, amount_cents: parseInt(amount * 100, 10) });

export const refundApi = (id, amount) => request
  .post(`/conversations/${ id }/money_transfers`)
  .set('Accept', 'application/json')
  .send({ ng: true, chat: true, amount_cents: parseInt(amount * 100, 10) });

export const stopChargeApi = (id, userId) => request
  .post(`/users/${ userId }/chats/${ id }/cancel_charge`)
  .set('Accept', 'application/json')
  .send({ ng: true });

export const rejectChargeApi = (id, userId) => request
  .post(`/users/${ userId }/chats/${ id }/reject_charge`)
  .set('Accept', 'application/json')
  .send({ ng: true });

export const rejectCreditApi = (id, userId) => request
  .post(`/users/${ userId }/chats/${ id }/reject_credit`)
  .set('Accept', 'application/json')
  .send({ ng: true });

export const acceptCheckApi = (id, userId) => request
  .post(`/users/${ userId }/chats/${ id }/accept_check`)
  .set('Accept', 'application/json')
  .send({ ng: true });

export const rejectCheckApi = (id, userId) => request
  .post(`/users/${ userId }/chats/${ id }/reject_check`)
  .set('Accept', 'application/json')
  .send({ ng: true });

export const acceptChargeApi = (id, userId) => request
  .post(`/users/${ userId }/chats/${ id }/accept_charge`)
  .set('Accept', 'application/json')
  .send({ ng: true });

export const pingChargeApi = (id, userId) => request
  .post(`/users/${ userId }/chats/${ id }/ping`)
  .set('Accept', 'application/json')
  .send({ ng: true });

export const historyApi = (clientId, clientUuid, conversationId) => request
  .get(`/history?client_id=${ clientId }&call_id=${ conversationId }&client_uuid=${ clientUuid }&ng=true`)
  .set('Accept', 'application/json');

export const blockUserApi = (conversationId) => request
  .post(`/blockings?conversation_id=${ conversationId }&ng=true`)
  .set('Accept', 'application/json');

export const extendIntroductoryApi = (id, userId) => request
  .post(`/users/${ userId }/chats/${ id }/extend_introductory`)
  .set('Accept', 'application/json')
  .send({ ng: true });

export const leaveReviewApi = (id, rating, comment) => request
  .post('/feedback/create')
  .set('Accept', 'application/json')
  .send({ ng: true, conversation_id: id, feedback: { rating, comment } });

export const unBlockUserApi = (blockId) => request
  .del(`/blockings/${ blockId }`)
  .set('Accept', 'application/json')
  .send({ ng: true });

export const connectionEventApi = (id, userId, event, payload = {}) => request
  .post(`/users/${ userId }/chats/${ id }/connection`)
  .set('Accept', 'application/json')
  .send({ ...payload, ng: true, event });
