import { writeFixtures } from './fixtures.mjs';

export default async function globalSetup() {
  await writeFixtures();
}
