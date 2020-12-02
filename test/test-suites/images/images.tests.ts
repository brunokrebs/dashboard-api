import axios from 'axios';
import { getCredentials } from '../utils/credentials';
import imageFixtures from './images.fixtures.json';
import {
  executeQueries,
  cleanUpDatabase,
  executeQuery,
} from '../utils/queries';
import { toNumber } from 'lodash';

describe('media library tests', () => {
  let authorizedRequest: any;

  beforeEach(async () => {
    authorizedRequest = await getCredentials();

    await cleanUpDatabase();

    const insertImages: string[] = imageFixtures.map(image => {
      return `insert into image (id, main_filename, original_filename, mimetype, original_file_url,
            extra_large_file_url, large_file_url, medium_file_url, small_file_url, thumbnail_file_url,
            file_size, width, height, aspect_ratio,archived)
            values (
              ${image.id}, '${image.mainFilename}', '${image.originalFilename}', '${image.mimetype}',
              '${image.originalFileURL}', '${image.extraLargeFileURL}', '${image.largeFileURL}',
              '${image.mediumFileURL}', '${image.smallFileURL}', '${image.thumbnailFileURL}',
              ${image.fileSize}, ${image.width}, ${image.height}, ${image.aspectRatio},${image.archived}
            );`;
    });
    await executeQueries(...insertImages);
  });

  it('should paginate images that are not archived ', async () => {
    const pageOne = await axios.get(
      'http://localhost:3005/v1/media-library?page=0&showArchived=false',
      authorizedRequest,
    );
    expect(pageOne.data.length).toBe(24);
    expect(pageOne.data[0].id).toBe(26);
    expect(pageOne.data[1].id).toBe(25);
    expect(pageOne.data[2].id).toBe(24);

    const pageTwo = await axios.get(
      'http://localhost:3005/v1/media-library?page=1&showArchived=false',
      authorizedRequest,
    );
    expect(pageTwo.data.length).toBe(1);
    expect(pageTwo.data[0].id).toBe(2);
  });

  it('should paginate images that are archived ', async () => {
    const pageOne = await axios.get(
      'http://localhost:3005/v1/media-library?page=0&showArchived=true',
      authorizedRequest,
    );
    expect(pageOne.data.length).toBe(2);
    expect(pageOne.data[0].id).toBe(27);
    expect(pageOne.data[1].id).toBe(1);

    await executeQuery('UPDATE image SET archived=true WHERE id NOT IN(1,27)');
    await executeQuery('UPDATE image SET archived=false WHERE id IN(1,27)');

    const pageTwo = await axios.get(
      'http://localhost:3005/v1/media-library?page=1&showArchived=true',
      authorizedRequest,
    );
    expect(pageTwo.data.length).toBe(1);
    expect(pageTwo.data[0].id).toBe(2);
  });

  it('should mark image with archived', async () => {
    {
      const image = imageFixtures[1];
      expect(image.archived).toBe(false);

      await axios.delete(
        `http://localhost:3005/v1/media-library/${image.id}`,
        authorizedRequest,
      );

      const [{ archived }] = await executeQuery(
        `SELECT archived FROM image WHERE id = ${image.id}`,
      );
      expect(archived).toBe(true);
    }
  });

  it('should mark the image as unarchived', async () => {
    {
      const image = imageFixtures[0];
      expect(image.archived).toBe(true);

      await axios.put(
        `http://localhost:3005/v1/media-library/${image.id}`,
        null,
        authorizedRequest,
      );

      const [{ archived }] = await executeQuery(
        `SELECT archived FROM image WHERE id = ${image.id}`,
      );
      expect(archived).toBe(false);
    }
  });
});
