import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Form from 'components/form';
import { Button } from 'semantic-ui-react';
import 'navigator.sendbeacon';
import Transcript from '../transcript';
import Status from '../status';
import QueryRequirements from '../query_requirements';
import Header from '../header';
import Ringing from './ringing';
import ChatEnded from '../chat_ended';
import FullScreenMessage from '../full_screen_message';
import Pubnub from '../pub_nub';
import Classes from './styles';
import Tools from '../tools';
import Constants from '../../config/const';
import NewMessageBtn from './new_message';
// import { openDevTools } from '../../actions/electron';

const onBeforeUnload = (e) => {
  e.returnValue = 'Are you sure?';
  e.preventDefault();
};


export default class Chat extends PureComponent {
  static propTypes = {
    role: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    hasPubnub: PropTypes.bool.isRequired,
    peer: PropTypes.shape({
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string
    }),
    error: PropTypes.string,
    startChat: PropTypes.func,
    hangup: PropTypes.func.isRequired,
    close: PropTypes.func.isRequired,
    details: PropTypes.shape({
      endReason: PropTypes.string,
      centsPerMinute: PropTypes.number,
      totalCharge: PropTypes.number
    }),
    hangingUp: PropTypes.bool,
    charging: PropTypes.shape({
      check: PropTypes.string.isRequired,
      ppm: PropTypes.string.isRequired
    }).isRequired,
    firstMessage: PropTypes.string,
    flushLogger: PropTypes.func.isRequired,
    blockingUser: PropTypes.func,
    blocking: PropTypes.bool,
    userIsBlocked: PropTypes.bool.isRequired,
    processBlock: PropTypes.bool.isRequired,
    beaconHangup: PropTypes.func,

    overchargeLocked: PropTypes.bool.isRequired,
    startCharge: PropTypes.func,
    stopCharge: PropTypes.func,
    logAction: PropTypes.func.isRequired,
    setScroll: PropTypes.func.isRequired,
    showScrollButton: PropTypes.bool.isRequired,
    scrollButtonToggle: PropTypes.func.isRequired
  };

  static defaultProps = {
    peer: {
      avatar: null
    },
    error: null,
    details: null,
    hangingUp: null,
    firstMessage: null,
    blocking: false,
    blockingUser: null,
    beaconHangup: null,
    startCharge: null,
    stopCharge: null,
    startChat: null
  };

  constructor(props) {
    super(props);
    this.doScroll = this.doScroll.bind(this);
    this.setRootRef = this.setRootRef.bind(this);
    this.onTabClosed = this.onTabClosed.bind(this);
    this.onScrolled = this.onScrolled.bind(this);
    this.mixpanelWait = null;
    this.chatStarted = false;
  }

  componentDidMount() {
    window.addEventListener('unload', this.onTabClosed, false);

    if (this.props.role === 'buyer') {
      window.addEventListener('beforeunload', onBeforeUnload, false);
      this.onBuyerMounted();
    } else if (window.mixpanel && window.mixpanel.identify && window.ng_chat_options.advisor) {
      window.mixpanel.identify(window.ng_chat_options.advisor.id);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.role === 'seller') {
      const propsInfo = this.renderSellerFooter(this.props);
      const prevPropsInfo = this.renderSellerFooter(prevProps);
      if (propsInfo && !prevPropsInfo) { this.doScroll(); }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('unload', this.onTabClosed);
    if (this.props.role === 'buyer') {
      window.removeEventListener('beforeunload', onBeforeUnload);
    }
    if (this.mixpanelWait) {
      clearTimeout(this.mixpanelWait);
      this.mixpanelWait = null;
    }
    this.props.flushLogger();
  }

  onBuyerMounted() {
    const opts = {
      ...window.ng_chat_options.create,
      first_message: this.props.firstMessage
    };
    this.waitForMixPanel(() => {
      this.startChatWithMixpanel(opts);
    });
  }

  onTabClosed() {
    if (!this.props.beaconHangup) { return; }
    const { ended, failed, rejected } = Constants.CHAT.STATUSES;
    const { status, role } = this.props;
    if (role === 'seller') { return; }
    if (status === failed || status === rejected || status === ended) { return; }
    this.props.beaconHangup();
  }

  onSendMessage = () => {
    this.props.close();
    if (window.sendMessagePath) {
      window.location.href = window.sendMessagePath;
      return;
    }
    if (document.querySelector('#leave_a_message_button')) {
      document.querySelector('#leave_a_message_button').click();
    }
  };

  onScrolled(e) {
    const { scrollHeight, scrollTop, clientHeight } = e.target;
    this.props.setScroll(scrollHeight === scrollTop + clientHeight);
  }

  setRootRef(el) {
    this.el = el;
  }

  callbackWithMixPanel(callback, text) {
    this.props.logAction(text);
    callback();
  }

  waitForMixPanel(callback) {
    if (!window.mixpanel) { this.callbackWithMixPanel(callback, 'starting chat: no mp'); return; }

    if (!window.mixpanel_token) { this.callbackWithMixPanel(callback, 'starting chat: no mp token'); return; }

    if (window.mixpanel.get_distinct_id) { this.callbackWithMixPanel(callback, 'starting chat: has get_distinct_id'); return; }

    this.props.logAction('starting chat: no mp - waiting');
    this.mixpanelWait = setTimeout(() => {
      this.mixpanelWait = null;
      this.props.logAction('starting chat: no mp - stop waiting');
      callback();
    }, 3000);

    window.mixpanel.init(window.mixpanel_token, {
      loaded: () => {
        if (this.mixpanelWait) {
          clearTimeout(this.mixpanelWait);
          this.props.logAction('starting chat: mp arrived');
          this.mixpanelWait = null;
          callback();
        }
      }
    });
  }


  startChatWithMixpanel(originalOpts) {
    const opts = { ...originalOpts };
    if (window.mixpanel.get_distinct_id) {
      opts.mixpanel_distinct_id = window.mixpanel.get_distinct_id();
      this.props.logAction('starting chat: has distinct id');
    } else {
      this.props.logAction('starting chat: no distinct id');
    }

    if (window.mixpanel.track) {
      window.mixpanel.track('b_chat started', {
        'click source': 'NG:TODO',
        'click placement': 'NG:TODO',
        'start delay': 'NG:TODO',
        'chat connection mode': 'pubnub',
        'seller id': window.ng_chat_options.advisor.id
      });
    }
    this.doStartChat(opts);
  }

  doStartChat = (opts) => {
    if (this.chatStarted) { return; }
    this.chatStarted = true;
    if (this.props.startChat) {
      this.props.startChat(opts);
    }
  };

  doScroll() {
    if (this.el) {
      this.el.scrollTop = this.el.scrollHeight;
    }
  }

  sellerFooter(isSeller) {
    const { started } = Constants.CHAT.STATUSES;
    if (isSeller && this.props.status === started) {
      return (
        <div className={ Classes.footer }>
          <Tools />
        </div>
      );
    }

    return null;
  }

  renderHeader() {
    const hasHangup = [
      Constants.CHAT.STATUSES.initial,
      Constants.CHAT.STATUSES.connectingToPubnub,
      Constants.CHAT.STATUSES.ringing,
      Constants.CHAT.STATUSES.started
    ].find((v) => v === this.props.status);

    const {
      close,
      hangup,
      hangingUp,
      status,
      role,
      blockingUser,
      userIsBlocked,
      processBlock
    } = this.props;
    const { name, avatar } = this.props.peer;
    const props = {
      avatar,
      name,
      close
    };

    if (hasHangup) {
      props.action = 'Hang up';
      props.onClick = hangup;
      props.hangingUp = hangingUp;
    }

    if (status === Constants.CHAT.STATUSES.ended && role === 'seller') {
      props.blockUser = true;
      props.blockingUser = blockingUser;
      props.userIsBlocked = userIsBlocked;
      props.processBlock = processBlock;
    }

    return (
      <Header { ...props } />
    );
  }

  renderStatus() {
    return (this.props.status === Constants.CHAT.STATUSES.started) ?
      (<Status role={ this.props.role } />) :
      null;
  }

  renderBody() {
    const {
      started, ended, initial, connectingToPubnub, failed, rejected, ringing, queryRequirements
    } = Constants.CHAT.STATUSES;
    const { status, role, error, peer: { name } } = this.props;
    switch (status) {
      case failed || rejected:
        return <FullScreenMessage icon="remove circle" text={ error } />;
      case initial || connectingToPubnub:
        return <FullScreenMessage icon="loader" text="Connecting, please wait..." />;
      case queryRequirements:
        return <QueryRequirements />;
      case ringing:
        return <Ringing role={ role } name={ name } />;
      case started:
        return <Transcript doScroll={ this.doScroll } role={ role } />;
      case ended:
        return <ChatEnded role={ role } />;
      default:
        return null;
    }
  }

  renderLeaveMessage(hasLeaveAMessage) {
    if (hasLeaveAMessage) {
      return (
        <Button basic color="green" onClick={ this.onSendMessage }>
        Leave A Message
      </Button>
      );
    }
    return null;
  }

  renderNewMessagesBtn(showScrollButton, scrollButtonToggle) {
    if (showScrollButton) {
      return (<NewMessageBtn click={ () => {
        scrollButtonToggle(true);
        this.doScroll();
      } }
      />);
    }
    return null;
  }

  renderBottom() {
    const { ended, started, failed, rejected } = Constants.CHAT.STATUSES;
    const { role, status, hangingUp, showScrollButton, scrollButtonToggle } = this.props;
    if ([ended, failed, rejected].find((v) => v === status)) {
      const hasLeaveAMessage = role === 'buyer' && status !== ended;
      const msg = this.renderLeaveMessage(hasLeaveAMessage);
      const hasMsg = window.sendMessagePath || document.querySelector('#leave_a_message_button');
      return (
        <div className={ Classes.footerEnded }>
          { hasMsg ? msg : null }
        </div>
      );
    }
    const newMessagesBtn = this.renderNewMessagesBtn(showScrollButton, scrollButtonToggle);

    if (started === status && !hangingUp) {
      return (
        <div>
          { newMessagesBtn }
          <div className={ Classes.footer }>
            <Form role={ this.props.role } doScroll={ this.doScroll } />
          </div>
        </div>
      );
    }
    return null;
  }

  renderPubNub() {
    const hasPubnub = this.props.hasPubnub && this.props.status !== Constants.CHAT.STATUSES.ended;
    const showPubnubError = this.props.status !== Constants.CHAT.STATUSES.initial &&
      this.props.status !== Constants.CHAT.STATUSES.connectingToPubnub;
    const { role } = this.props;

    return hasPubnub ?
      (<Pubnub peerName={ this.props.peer.name } role={ role } showError={ showPubnubError } />) :
      null;
  }

  renderSellerFooter = (props) => {
    if (props.overchargeLocked && props.status !== Constants.CHAT.STATUSES.ended) {
      return (
        <div className={ Classes.chargeRequested }>
          <div>
            <strong>Your client has run out of credit.</strong>
            <br />
            Click below to request your client to authorize more funding for this call.
            <br />
            <Button basic color="grey" onClick={ props.startCharge }>
              Continue Charging
            </Button>
            <Button basic color="grey" onClick={ props.stopCharge }>
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    if (props.charging.ppm === Constants.CHAT.CHARGING.chargeRequested) {
      return (
        <div className={ Classes.chargeRequested }>
          <div>
            Requesting per-minute charge.
            <br />
            Please wait while your client is authorizing payment (this may take a few minutes).
            <br />
            <strong>You will be notified when payment arrives</strong>. This call remains active.
          </div>
        </div>
      );
    }

    if (props.charging.ppm === Constants.CHAT.CHARGING.creditRequested) {
      return (
        <div className={ Classes.chargeRequested }>
          <div>
            Please wait while your client is verifying payment capability
            (this may take a few minutes).
            <br />
            <strong>You will be notified when payment capability is verified</strong>.
            This call remains active.
          </div>
        </div>
      );
    }

    if (props.charging.check === Constants.CHAT.CHARGING.checkRequested) {
      return (
        <div className={ Classes.chargeRequested }>
          <div>
            Please wait while your client is authorizing payment (this may take a few minutes).
            <br />
            <strong>You will be notified when payment arrives</strong>. This call remains active.
          </div>
        </div>
      );
    }

    return null;
  }

  render() {
    const isSeller = this.props.role === 'seller';
    const sellerFooter = this.sellerFooter(isSeller);
    const sellerFooterInfo = isSeller ? this.renderSellerFooter(this.props) : null;
    const className = isSeller || window.mobileBuyer ? Classes.fullscreen : Classes.chat;

    return (
      <div className={ className } onScroll={ this.onScrolled }>
        { this.renderHeader() }
        { this.renderStatus() }
        { this.renderPubNub() }
        <div className={ Classes.body } ref={ this.setRootRef }>
          { this.renderBody() }
        </div>
        { sellerFooterInfo }
        { this.renderBottom() }
        { sellerFooter }
      </div>
    );
  }
}
