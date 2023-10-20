import { get } from 'lodash';
import { convertBulkStringsToObject, convertRedisInfoReplyToObject } from 'src/utils';
import { RedisClient } from 'src/modules/redis/client';

export const getTotalKeysFromInfo = async (client: RedisClient) => {
  try {
    const currentDbIndex = get(client, ['options', 'db'], 0);
    const info = convertRedisInfoReplyToObject(
      await client.sendCommand(['info', 'keyspace'], {
        replyEncoding: 'utf8',
      }) as string,
    );

    const dbInfo = get(info, 'keyspace', {});
    if (!dbInfo[`db${currentDbIndex}`]) {
      return 0;
    }

    const { keys } = convertBulkStringsToObject(dbInfo[`db${currentDbIndex}`], ',', '=');
    return parseInt(keys, 10);
  } catch (err) {
    return -1;
  }
};

export const getTotalKeysFromDBSize = async (client: RedisClient) => {
  const total = await client.sendCommand(['dbsize'], {
    replyEncoding: 'utf8',
  }) as string;
  return parseInt(total, 10);
};

export const getTotalKeys = async (client: RedisClient): Promise<number> => {
  try {
    return await getTotalKeysFromDBSize(client);
  } catch (err) {
    return await getTotalKeysFromInfo(client);
  }
};
