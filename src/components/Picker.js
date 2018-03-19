// @flow

import * as React from 'react';
import NewWindow from 'react-new-window'
import pcloudSdk from 'pcloud-sdk-js';
import styled, { keyframes } from 'styled-components';
import { List, Map } from 'immutable';
import { CLIENT_ID, REDIRECT_URI } from '../config/constants';
import { Navigation, ItemsList } from '.';
import { parseItem } from '../utils';

type PickerProps = {

};

type folder = {
  folderName: string,
  items: null | List<any>
};

type PickerState = {
  isReady: boolean,
  path: List<number>,
  folders: Map<string, folder>,
  selectedItemId: number
};

class Picker extends React.Component<PickerProps, PickerState> {
  constructor() {
    super();

    this.state = {
      isReady: false,
      path: List([0]),
      folders: Map({
        '0': {
          folderName: 'pCloud',
          items: null
        }
      }),
      selectedItemId: 0
    };

    (this: any)._client = null;
    (this: any)._receiveToken = this._receiveToken.bind(this);
    (this: any)._getToken = this._getToken.bind(this);
    (this: any)._onFolderDoubleClick = this._onFolderDoubleClick.bind(this);
    (this: any)._onItemClick = this._onItemClick.bind(this);
    (this: any)._onItemDoubleClick = this._onItemDoubleClick.bind(this);
    (this: any)._onChooseButtonClick = this._onChooseButtonClick.bind(this);
    (this: any)._onCloseButtonClick = this._onCloseButtonClick.bind(this);
    (this: any)._onNavigationClick = this._onNavigationClick.bind(this);
  }

  _getToken() {
    pcloudSdk.oauth.initOauthToken({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      receiveToken: this._receiveToken
    });
  }

  _receiveToken(token: string) {
    (this: any)._client = this._getClient(token);

    this._setItems();
    this.setState({ isReady: true });
  }

  _getClient(token: string) {
    //handle errors
    return pcloudSdk.createClient(token);
  }

  _fetchItems(folderId: number) {
    return (this: any)._client.listfolder(folderId, { iconformat: 'id' })
      .then(res => res.contents)
      .then(items => items.map(parseItem));
  }

  _setItems() {
    const { path, folders } = this.state;
    const currentFolderId = path.last();
    const currentItems = folders.getIn([String(currentFolderId), 'items']);

    if (currentItems === null) {
      this._fetchItems(Number(currentFolderId))
        .then(items => this.setState({
          folders: folders.setIn([String(currentFolderId), 'items'], List(items))
        }));
    }
  }

  _onFolderDoubleClick(folderId: number, name: string) {
    const { path, folders } = this.state;

    if (!folders.has(folderId.toString())) {
      this.setState({
        folders: folders.set(folderId.toString(), {
          folderName: name,
          items: null
        }),
        path: path.push(folderId),
        selectedItemId: folderId
      });
    } else {
      this.setState({
        path: path.push(folderId),
        selectedItemId: folderId
      });
    }
  }

  _onItemClick(id: number) {
    this.setState({ selectedItemId: id })
  }

  _onItemDoubleClick(isFolder: boolean, id: number, name: string) {

    if (isFolder) {
      this._onFolderDoubleClick(id, name);
    } else {
      this._onChooseButtonClick(id);
    }
  }

  _onCloseButtonClick() { }

  _onChooseButtonClick(id: number) {

  }

  _onNavigationClick(folderId: number) {
    const { path } = this.state;
    const indexOfCurrentId = path.indexOf(folderId);

    this.setState({
      path: path.slice(0, indexOfCurrentId + 1),
      selectedItemId: folderId
    });
  }

  componentDidUpdate(prevProps: PickerProps, { folders: prevFolders }: PickerState) {
    const { folders } = this.state;

    if (folders !== prevFolders) {
      this._setItems();
    }
  }

  _renderHeader() {
    const { path, folders } = this.state;

    return (
      <Navigation
        path={path}
        folders={folders}
        onNameClick={this._onNavigationClick}
      />
    );
  }

  _renderItems() {
    const { path, folders, selectedItemId } = this.state;
    const currentFolderId = path.last();
    const currentItems = folders.getIn([String(currentFolderId), 'items']);

    return (
      <div>
        {currentItems === null ?
          <Loader /> :
          <ItemsList
            selectedItemId={selectedItemId}
            items={currentItems}
            onItemClick={this._onItemClick}
            onItemDoubleClick={this._onItemDoubleClick}
          />
        }
      </div>
    );
  }

  _renderFooter() {
    return (
      <Footer>
        <CancelButton onClick={this._onCloseButtonClick}>Cancel</CancelButton>
        <DefaultButton onClick={this._onChooseButtonClick}>Choose</DefaultButton>
      </Footer>
    );
  }

  render() {
    const { isReady } = this.state;

    return (
      <Wrapper>
        {isReady ?
          <PickerWapper>
            <Header>{this._renderHeader()}</Header>
            <Section>{this._renderItems()}</Section>
            {this._renderFooter()}
          </PickerWapper> :
          <DefaultButton onClick={this._getToken}>pCloud</DefaultButton>
        }
      </Wrapper>
    );
  }
}

export default Picker;

const Wrapper = styled.div`
  margin: 10px;
  font: 11px/34px Arial, Helvetica;
  color: #999;
`;

const PickerWapper = styled.div`
  width: 30vw;
  min-width: 500px;
  user-select: none;
`;

const Header = styled.header`
  border: 1px solid #e9e9e9;
  border-bottom: 0;
  box-sizing: border-box;
`;

const Section = styled.section`
  position: relative;
  height: 250px;
  border: 1px solid #e9e9e9;
  border-bottom: 0;
  box-sizing: border-box;
  overflow-x: hidden;
`;

const Pulsate = keyframes`
  0% {transform: scale(0.1, 0.1); opacity: 0;}
  50% {opacity: 1;}
  100% {transform: scale(1.2, 1.2); opacity: 0;}
`;

const Loader = styled.div`
position: absolute;
width: 50px;
height: 50px;
top: 50%;
left: 50%;
margin: -25px 0 0 -25px;
border: 4px solid #20bed6;
border-radius: 30px;
animation: ${Pulsate} 1s ease-out;
animation-iteration-count: infinite;
opacity: 0;
`;

const Footer = styled.footer`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  border: 1px solid #E9E9E9;
  height: 70px;
`;

const DefaultButton = styled.div`
  cursor: pointer;
  background: #20bed6;
  color: #fff;
  margin: 10px;
  padding: 0 20px;
  height: 28px;
  width: 50px;
  line-height: 28px;
  font-weight: bold;
  text-align: center;
  border-radius: 3px;
  user-select: none;
`;

const CancelButton = DefaultButton.extend`
  background: #FFFFFF;
  border: 1px solid #E9E9E9;
  color: #999;
`;