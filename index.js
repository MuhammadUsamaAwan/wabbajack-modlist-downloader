import fs from 'fs';
import axios from 'axios';

const modlist = JSON.parse(fs.readFileSync('modlist.json'));

const mods = modlist.Archives.filter((a) => a.State.$type === 'NexusDownloader, Wabbajack.Lib').map((a) => ({
  name: a.Name,
  gameName: a.State.GameName,
  modId: a.State.ModID,
  fileId: a.State.FileID,
}));

if (!fs.existsSync('mods')) {
  fs.mkdirSync('mods');
}

for (const mod of mods) {
  if (fs.existsSync(`mods/${mod.name}`)) {
    console.log(`Skipping ${mod.name} as it already exists`);
    continue;
  }
  console.log(`Downloading ${mod.name}`);
  const downloadLinkResponse = await axios.get(
    `https://api.nexusmods.com/v1/games/${mod.gameName}/mods/${mod.modId}/files/${mod.fileId}/download_link.json`,
    {
      headers: {
        apikey: process.env.NEXUS_API_KEY,
      },
    }
  );
  const downloadLink = downloadLinkResponse.data[0].URI;
  const modResponse = await axios.get(downloadLink, {
    responseType: 'stream',
  });
  modResponse.data.pipe(fs.createWriteStream(`mods/${mod.name}`));
  await new Promise((resolve, reject) => {
    modResponse.data.on('end', resolve);
    modResponse.data.on('error', reject);
  });
}
