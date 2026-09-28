import React from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { formatMessage, MainMenuContribution, withModulesManager } from '@openimis/fe-core';
import { MAIN_MENU_ID, MODULE_KEY } from '../constants';

// The module's main menu, listing the contributions to MAIN_MENU_ID the user
// may open. With the fe-core "menus" configuration, MainMenuContribution takes
// the entries that configuration lists for MAIN_MENU_ID instead.
function DeduplicationMainMenu(props) {
  const { intl, modulesManager, rights } = props;
  const entries = modulesManager
    .getContribs(MAIN_MENU_ID)
    .filter((entry) => !entry.filter || entry.filter(rights));
  const configured = modulesManager.getConf('fe-core', 'menus', []);
  if (!configured?.length && !entries.length) return null;
  return (
    <MainMenuContribution
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      header={formatMessage(intl, MODULE_KEY, 'mainMenu')}
      entries={entries}
      menuId={MAIN_MENU_ID}
    />
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
});

export default withModulesManager(injectIntl(connect(mapStateToProps)(DeduplicationMainMenu)));
