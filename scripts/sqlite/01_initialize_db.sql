-- THe DB will already be initialized since it is created by Apple during the
-- backup sync, so perhaps this file should be renamed. Anyway, the purpose of
-- this file is to do any bootstrapping needed to prepare the db for use.

-- This view is the primary data source for paginated message lists.
--
-- NOTE: This oddness with the date is due to how apple handles timestamps.
-- In Apples system the timestamps represent number of seconds since 2001-01-01
-- rather than 1970-01-01 like most systems. As such, we need to add the missing
-- 31 years worth of seconds to the timestamp for it work properly with
DROP VIEW IF EXISTS all_messages;
CREATE VIEW all_messages AS
  SELECT
    datetime(m.date + 978307200, 'unixepoch', 'localtime') as timestamp,
    m.handle_id,
    h.id as handle,
    h.uncanonicalized_id as uncanonicalized_handle,
    h.service,
    m.is_from_me,
    m.text,
    m.date_read,
    m.account,
    c.account_login,
    c.chat_identifier,
    c.guid as chat_guid
  from message m
    left join handle h on h.ROWID = m.handle_id
    left join chat_message_join j ON m.ROWID = j.message_id
    left join chat c on c.ROWID = j.chat_id
  ORDER BY date DESC;
