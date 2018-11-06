 
import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import 'semantic-ui-css/semantic.min.css';
import 'assets/global.css';
import { Icon, Form, Button, Dimmer, Loader, Message } from 'semantic-ui-react';
import SmallWindow from '../components/small_window';
import { ipcOpenBrowser } from '../lib/ipc';
import classes from './styles.css';
import CONST from '../../const';
import log from './../../main/logs';


const noAccount = (e) => {
  e.preventDefault();
  ipcOpenBrowser('http://www.bitwine.com/user/greeting');
};

const forgotPassword = (e) => {
  e.preventDefault();
  ipcOpenBrowser('http://www.bitwine.com/user/password_restore');
};


class Login extends React.Component {
  static contextTypes = {
    name: PropTypes.string
  };

  constructor(props, context) {
    super(props, context);
    this.onNameChange = this.onNameChange.bind(this);
    this.onPasswordChange = this.onPasswordChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onIPCMessage = this.onIPCMessage.bind(this);
    this.state = {
      login: localStorage.getItem('lastLogin') || '',
      password: '',
      errors: {
        login: false,
        password: false
      },
      wrongPassword: false,
      show: 'form'
    };
  }

  onNameChange(e, data) {
    this.setState({
      ...this.state,
      login: data.value.trim(),
      errors: {
        ...this.state.errors,
        login: false
      },
      wrongPassword: false
    });
    log.info(data);
  }

  onPasswordChange(e, data) {
    this.setState({
      ...this.state,
      password: data.value.trim(),
      errors: {
        ...this.state.errors,
        password: false
      },
      wrongPassword: false
    });
  }

  onSubmit(e) {
    e.preventDefault();
    if (!this.validateForm()) { return; }
    const { login, password } = this.state;
    localStorage.setItem('lastLogin', login);
    this.window.sendIPCMessage({ action: CONST.windowActions.login, login, password });
  }

  onIPCMessage(event, data) {
    log.info('onIPCMessage', event, data);
    switch (data.type) {
      case CONST.windows.login.showLoading: {
        return this.setState({ ...this.state, show: 'loading' });
      }
      case CONST.windows.login.showForm: {
        return this.setState({ ...this.state, show: 'form' });
      }
      case CONST.windows.login.loginFailed: {
        return this.setState({ ...this.state, show: 'form', errorMessage: data.error });
      }
      case CONST.windows.login.loginSucceed: {
        setTimeout(() => {
          this.window.closeWindow();
        }, 1500);
        return this.setState({ ...this.state, show: 'success' });
      }
      default:
        return true;
    }
  }

  validateForm() {
    let passed = true;
    if (!this.state.login) {
      this.setState({ ...this.state, errors: { ...this.state.errors, login: true } });
      passed = false;
    }
    if (!this.state.password) {
      this.setState({ ...this.state, errors: { ...this.state.errors, password: true } });
      passed = false;
    }
    return passed;
  }

  renderForm() {
    const errorMessage = this.state.errorMessage ?
      (
        <Message negative size="mini" className={ classes.errorMessage }>
          { this.state.errorMessage }
        </Message>
      ) :
      null;
    return (
      <Form onSubmit={ this.onSubmit }>
        { errorMessage }
        <Form.Input
          placeholder="User Name"
          focus
          onChange={ this.onNameChange }
          value={ this.state.login }
          error={ this.state.errors.login }
        />
        <Form.Input
          placeholder="Password"
          type="password"
          onChange={ this.onPasswordChange }
          value={ this.state.password }
          error={ this.state.errors.password }
        />
        <div className={ classes.formBottom }>
          <Button basic color="orange" type="submit">Login</Button>
          <div className={ classes.links }>
            <a
              href="#"
              onClick={ forgotPassword }
              className={ classes.link }
            >
              Forgot your password?
            </a>
            <a
              href="#"
              onClick={ noAccount }
              className={ `${ classes.link } ${ classes.dontHave }` }
            >
              Don&#39;t have BitWine account?
            </a>
          </div>
        </div>
      </Form>
    );
  }

  renderContent() {
    if (this.state.show === 'form') {
      return this.renderForm();
    }
    if (this.state.show === 'success') {
      return (
        <Dimmer active>
          <Icon name="checkmark" color="green" size="huge" />
          Logged In Succesfully
        </Dimmer>
      );
    }
    return (
      <Dimmer active>
        <Loader>Logging in, please wait...</Loader>
      </Dimmer>
    );
  }

  render() {
    return (
      <SmallWindow onIPCMessage={ this.onIPCMessage } ref={ (r) => { this.window = r; } }>
        { this.renderContent() }
      </SmallWindow>
    );
  }
}

ReactDOM.render(<Login />,
  document.getElementById('root'));
