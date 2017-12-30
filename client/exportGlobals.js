import * as Messages from './modules/messages';

export default function exportGlobals(target, extra) {
  target.Messages = Messages;
  Object.assign(target, extra);
}
