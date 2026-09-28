import { makeStyles } from '@material-ui/core';
import { defaultFilterStyles } from '../../util/styles';

export const usePageStyles = makeStyles((theme) => ({
  page: theme.page,
}));

export const useFilterStyles = makeStyles(defaultFilterStyles);

export const useCardStyles = makeStyles((theme) => ({
  card: {
    ...(theme.paper?.paper ?? {}),
    padding: theme.spacing(2),
    height: '100%',
  },
}));

// Layout and text helpers shared by the admin screens.
export const useAdminStyles = makeStyles((theme) => ({
  row: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  spaceBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
  },
  definitionList: {
    margin: 0,
  },
  definitionRow: {
    display: 'flex',
    gap: theme.spacing(2),
    padding: theme.spacing(0.5, 0),
  },
  definitionValue: {
    margin: 0,
  },
  monospace: {
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  },
  preformatted: {
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap',
    fontSize: '0.8rem',
  },
  preWrap: {
    whiteSpace: 'pre-wrap',
  },
  noWrap: {
    whiteSpace: 'nowrap',
  },
  textSuccess: {
    color: theme.palette.success.main,
  },
  textError: {
    color: theme.palette.error.main,
  },
  textSecondary: {
    color: theme.palette.text.secondary,
  },
  list: {
    margin: 0,
    paddingLeft: theme.spacing(2),
  },
}));
