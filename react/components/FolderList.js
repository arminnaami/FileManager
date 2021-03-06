import React from "react";

import FolderListItem from './FolderListItem';
import Constants from '../constants';
import FetchFromServer from '../FetchFromServer';

export default class FolderList extends React.Component {
  constructor (props) {
    super(props);
    this.state = {folderContents: [], pathObj: {}};
    this.state.pathObj.getCurrentFolderName = (path) => {
      if (this.state.pathObj.base) {
        return this.state.pathObj.base.slice(this.state.pathObj.base.lastIndexOf('/') + 1);
      }
      return "";
    };
    this.state.pathObj.parent = () => {
      if (this.state.pathObj.base) {
        return this.state.pathObj.base.slice(0, this.state.pathObj.base.lastIndexOf('/'));
      }
      return "";
    };

    document.addEventListener(Constants.Events.goBackFromContents, (e) => {
      this.goBack();
    });
  }

  componentDidMount () {
    this.state.pathObj.base = Constants.DefaultPath;
    if (this.props && this.props.pathObj && this.props.pathObj.base) {
      this.state.pathObj.base = this.props.pathObj.base;
    }
    this.fetchFromDirectory();
  }

  componentWillReceiveProps (newProps) {
    if (!this.props.pathObj) {
      this.state.pathObj.base = Constants.DefaultPath;
    }
    this.state.pathObj.base = newProps.pathObj.base;
    this.state.pathObj.getCurrentFolderName = () => {
      if (this.state.pathObj.base) {
        return this.state.pathObj.base.slice(this.state.pathObj.base.lastIndexOf('/') + 1);
      }
      return "";
    };
    this.fetchFromDirectory();
  }

  goBack (e) {
    let base = this.state.pathObj.base || Constants.DefaultPath;
    let lastIndex = base.lastIndexOf('/');
    /* This code wont allow to visit / path */
    if (base.indexOf('/') === base.lastIndexOf('/')) {
      return;
    }
    this.state.pathObj.base = base.slice(0, lastIndex);
    this.fetchFromDirectory();
  }

  moveToDirectory (targetFolder) {
    this.state.pathObj.base = `${this.state.pathObj.parent()}/${targetFolder}`;
    this.fetchFromDirectory();
  }

  fetchFromDirectory (directoryPath, preventUpdate) {
    FetchFromServer(`${Constants.BASE_URL}/directory?base=${encodeURIComponent(directoryPath || this.state.pathObj.base)}`)
      .then(contents => {
        if (contents === undefined) {
          return;
        }
        if (!preventUpdate) {
          contents.content = contents.content.sort(function (a, b) {
            if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
            if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
            return 0;
          });
          // console.log(contents.content);
          let event = new CustomEvent(Constants.Events.directoryChange, {detail: {'contents': contents.content.sort(), 'pathObj': this.state.pathObj}});
          document.dispatchEvent(event);
          this.fetchFromDirectory(this.state.pathObj.base.slice(0, this.state.pathObj.base.lastIndexOf('/')), true);
        } else {
          this.setState({folderContents: contents.content});
        }
      });
  }

  render () {
    let folderContents = this.state.folderContents;
    return (
      <div className="folderList">
        <span className="current-directory-name">{this.state.pathObj.parent().getCurrentFolderName()}</span><br />
        <span className="current-path">{this.state.pathObj.parent()}</span>
        <span onClick={this.goBack.bind(this)} className="cursor back-button back_button" href="" id="back-button"><i className="material-icons" role="presentation">keyboard_backspace</i>&nbsp;&nbsp;&nbsp;Back</span>
        <ul id="nav-folder-list">
          {
            folderContents.filter((content) => {
              if (document.hiddenVisible) {
                return true;
              } else {
                return content.name[0] !== '.';
              }
            }).map((content, index) => {
              if (!content.isFile) {
                return <li key={index} onClick={this.moveToDirectory.bind(this, content.name)} className="cursor folder-list-item" ><FolderListItem item={content} /></li>
              } else {
                return null;
              }
            })
          }
        </ul>
      </div>
    )
  }
}
