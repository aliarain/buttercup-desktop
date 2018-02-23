import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import styled from 'styled-components';
import { translate } from 'react-i18next';
import { Input as BaseInput } from '@buttercup/ui';
import { Scrollbars } from 'react-custom-scrollbars';
import { Flex, Box } from 'styled-flexbox';
import EntryIcon from './entry-icon';
import folderIcon from '../../styles/img/folder-open.svg';

const SearchWrapper = styled('div')`
  position: fixed;
  width: 100%;
  height: 100%;
  z-index: 3;
  left: 0;
  display: ${props => (props.visible ? 'block' : 'none')};
`;

const SearchOverlay = styled('div')`
  background-color: rgba(0, 0, 0, 0.4);
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  display: ${props => (props.visible ? 'block' : 'none')};
`;

const Search = styled(Flex)`
  position: absolute;
  z-index: 4;
  top: 50%;
  left: 50%;
  width: 50vw;
  max-width: 500px;
  transition: transform 0.3s;
  transform: translate(-50%, -50%);
  width: 100%;
`;

const Input = styled(BaseInput)`
  padding: 20px 10px;
  margin: ${props => (props.entries.length > 0 ? '0 0 20px 0' : 0)};
`;

/**
	* Entry-List
	*/
const EntryList = styled(Box)`
  background-color: #fff;
  padding: var(--spacing-two);
  border: 0;
  margin: 0;
  width: 100%;
  border-radius: 6px;
  position: relative;
  &:after {
    bottom: 100%;
    left: 30px;
    border: solid transparent;
    content: ' ';
    position: absolute;
    pointer-events: none;
    border-color: rgba(136, 183, 213, 0);
    border-bottom-color: #fff;
    border-width: 10px;
    margin-left: -10px;
  }
`;
const ListItem = styled('div')`
  margin: 0;
  font-size: 14px;
  padding: 15px;
  cursor: pointer;
  border-bottom: 1px solid #eee;

  &:last-child {
    border: 0;
  }

  &:hover {
    background-color: #00b7ac;
    color: #fff;
    p {
      color: #fff;
    }
  }
`;

const EntryData = styled('div')`
  display: inline-block;
  margin: -5px 0 0 0;
`;

const EntryFolder = styled('p')`
  font-size: 12px;
  color: #999;
  margin: 0;
`;

const Icon = styled('div')`
  float: left;
  margin: 0 10px 0 0;
`;

const FolderIcon = styled('img')`
  width: 22px;
`;

class ArchiveSearch extends PureComponent {
  static propTypes = {
    onSelectEntry: PropTypes.func,
    getArchive: PropTypes.func,
    currentArchive: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    onGroupSelect: PropTypes.func,
    t: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      archive: null,
      entries: [],
      groups: [],
      searchTerm: ''
    };
    this.changeInput = this.changeInput.bind(this);
    this.closeSearch = this.closeSearch.bind(this);
    this.searchListener = this.searchListener.bind(this);
    this.markFoundWordParts = this.markFoundWordParts.bind(this);
  }

  searchListener() {
    const { getArchive, currentArchive } = this.props;

    if (currentArchive) {
      const archive = getArchive(currentArchive.id);

      this.setState(state => ({
        visible: !state.visible,
        archive
      }));

      this._input.focus();
      this._input.select();
    }
  }

  closeSearch() {
    this.setState({
      visible: false
    });
  }

  changeInput(e) {
    const value = e.target.value;
    const entries = value
      ? this.state.archive.findEntriesByProperty('title', value)
      : [];
    const groups = value ? this.state.archive.findGroupsByTitle(value) : [];

    this.setState({
      searchTerm: e.target.value,
      entries,
      groups
    });
  }

  markFoundWordParts(word) {
    const regex = new RegExp('(' + this.state.searchTerm + ')', 'g');
    return word.replace(regex, '<mark>$1</mark>');
  }

  componentDidMount() {
    ipcRenderer.on('open-archive-search', this.searchListener);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener('open-archive-search', this.searchListener);
  }

  render() {
    const { entries, groups } = this.state;
    const { onSelectEntry, onGroupSelect, t } = this.props;

    return (
      <SearchWrapper visible={this.state.visible}>
        <SearchOverlay
          visible={this.state.visible}
          onClick={this.closeSearch}
        />
        <Search flexColumn visible={this.state.visible}>
          <Input
            bordered
            innerRef={input => {
              this._input = input;
            }}
            onChange={this.changeInput}
            value={this.state.searchTerm}
            placeholder={t('archive-search.searchterm')}
            type="text"
            entries={this.state.entries}
          />

          {entries.length > 0 ? (
            <EntryList flexAuto>
              <Scrollbars autoHeight autoHeightMax={300}>
                {entries.map((entry, index) => (
                  <ListItem
                    key={index}
                    onClick={() => {
                      onGroupSelect(entry.getGroup().getID());
                      onSelectEntry(entry.getID());

                      this.closeSearch();
                    }}
                  >
                    <Icon>
                      <EntryIcon icon={entry.icon} />
                    </Icon>
                    <EntryData>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: this.markFoundWordParts(
                            entry.getProperty('title')
                          )
                        }}
                      />
                      <EntryFolder>{entry.getGroup().getTitle()}</EntryFolder>
                    </EntryData>
                  </ListItem>
                ))}

                {groups.map((group, index) => (
                  <ListItem
                    key={index}
                    onClick={() => {
                      onGroupSelect(group.getID());

                      this.closeSearch();
                    }}
                  >
                    <Icon>
                      <FolderIcon src={folderIcon} />
                    </Icon>

                    <EntryData>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: this.markFoundWordParts(group.getTitle())
                        }}
                      />
                    </EntryData>
                  </ListItem>
                ))}
              </Scrollbars>
            </EntryList>
          ) : (
            ''
          )}
        </Search>
      </SearchWrapper>
    );
  }
}

export default translate()(ArchiveSearch);
