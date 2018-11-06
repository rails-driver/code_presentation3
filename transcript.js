 
import createReducer from 'config/createReducer';
import Constants from 'config/const';

const getDefaultState = () => ({
  messages: [],
  peerTyping: false,
  sendTyping: false,
  blocking: false,
  userIsBlocked: false,
  blockId: null,
  processBlock: false,
  lastSentAt: null,
  lastReceivedAt: null,
  lastReceivedMessageType: null,
  lastMessageSentAt: null,
  lastMessageReceivedAt: null
});

const buildLastMessageStats = (state, type, role) => {
  let {
    lastSentAt, lastReceivedAt, lastReceivedMessageType, lastMessageSentAt, lastMessageReceivedAt
  } = state;

  if (role === Constants.MSESSAGE_ROLES.peer) {
    if (type === Constants.MESSAGE_TYPES.text) { lastMessageReceivedAt = new Date(); }
    lastReceivedAt = new Date();
    lastReceivedMessageType = type;
  } else {
    lastSentAt = new Date();
    if (type === Constants.MESSAGE_TYPES.text) { lastMessageSentAt = new Date(); }
  }
  return {
    lastSentAt, lastReceivedAt, lastReceivedMessageType, lastMessageReceivedAt, lastMessageSentAt
  };
};

const dispatchText = (state, { message, publisher, timetoken, role }) => {
  const { id, body, type } = message;

  let { peerTyping } = state;

  if (role === Constants.MSESSAGE_ROLES.peer) {
    peerTyping = false;
  }
  const index = state.messages.findIndex((m) => m.message.id === id);
  if (index === -1) {
    return {
      peerTyping,
      messages: [
        ...state.messages,
        {
          message: { id, body, type },
          state: Constants.PUBNUB.MESSAGE_STATES.received,
          publisher,
          timetoken,
          role,
          time: new Date()
        }
      ]
    };
  }
  const before = state.messages.slice(0, index);
  const m = {
    ...state.messages[index],
    state: Constants.PUBNUB.MESSAGE_STATES.received,
    publisher,
    timetoken
  };
  if (!m.time) { m.time = new Date(); }
  const after = state.messages.slice(index + 1);
  return {
    peerTyping,
    messages: [...before, m, ...after]
  };
};

const markMessageAs = (messages, id, newState) => {
  const index = messages.findIndex((m) => m.message.id === id);
  const before = messages.slice(0, index);
  const after = messages.slice(index + 1);
  const m = { ...messages[index], state: newState };
  return [...before, m, ...after];
};

const transcript = createReducer(getDefaultState(), {
  [Constants.POPUP.ACTIONS.hide]: () => getDefaultState(),

  [Constants.PUBNUB.ACTIONS.send]: (state, { message }) => ({
    ...state,
    messages: [
      ...state.messages,
      { message, state: Constants.PUBNUB.MESSAGE_STATES.new, role: Constants.MSESSAGE_ROLES.own }
    ]
  }),

  [Constants.PUBNUB.ACTIONS.sendFailed]: (state, { id }) => ({
    ...state,
    messages: markMessageAs(state.messages, id, Constants.PUBNUB.MESSAGE_STATES.new)
  }),

  [Constants.PUBNUB.ACTIONS.sending]: (state, { id }) => ({
    ...state,
    messages: markMessageAs(state.messages, id, Constants.PUBNUB.MESSAGE_STATES.sending)
  }),

  [Constants.PUBNUB.ACTIONS.sendTyping]: (state) => ({
    ...state, sendTyping: true
  }),

  [Constants.PUBNUB.ACTIONS.typingSent]: (state) => ({
    ...state, sendTyping: false
  }),

  [Constants.PUBNUB.ACTIONS.adminMessage]: (state, { body, _type, options }) => ({
    ...state,
    messages: [
      ...state.messages,
      {
        message: {
          id: `admin${ (new Date()).getTime() }`,
          body,
          type: _type,
          options
        },
        state: Constants.PUBNUB.MESSAGE_STATES.received,
        publisher: 'admin',
        timetoken: -1,
        role: 'admin',
        time: new Date()
      }
    ]
  }),

  [Constants.PUBNUB.ACTIONS.typingReset]: (state) => ({
    ...state, peerTyping: false
  }),

  [Constants.PUBNUB.ACTIONS.userMessage]: (state, { message, publisher, timetoken, role }) => {
    const { type } = message;

    const lastMessageStats = buildLastMessageStats(state, type, role);

    if (type === Constants.MESSAGE_TYPES.text) {
      return {
        ...state,
        ...dispatchText(state, { message, publisher, timetoken, role }),
        ...lastMessageStats
      };
    }

    if (type === Constants.MESSAGE_TYPES.typing && role === Constants.MSESSAGE_ROLES.peer) {
      return { ...state, peerTyping: true, ...lastMessageStats };
    }

    return { ...state, ...lastMessageStats };
  },

  [Constants.PUBNUB.ACTIONS.sendBlocking]: (state, { blocking }) => ({
    ...state, blocking
  }),

  [Constants.PUBNUB.ACTIONS.sendBlock]: (state, { userIsBlocked, blockId, processBlock }) => ({
    ...state, userIsBlocked, blockId, processBlock
  })
});

export default transcript;
