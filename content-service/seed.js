require('dotenv').config({ path: '.env.seed' });
const axios = require('axios');
const FormData = require('form-data');

// ========== CONFIG ==========
const API_URL = process.env.API_URL || 'http://localhost:9000/api';
const PEXELS_API_KEY =
  process.env.PEXELS_API_KEY ||
  'NHpt3nWXDJS8pxofmIVdtMGmJZVvQEVH1iHBnF80Ok7RDTElpi6yGF2q';

const TAGS_POOL = [
  'travel',
  'food',
  'fitness',
  'nature',
  'music',
  'art',
  'fashion',
  'technology',
  'gaming',
  'photography',
  'lifestyle',
  'health',
  'sport',
  'cooking',
  'dance',
  'comedy',
  'motivation',
  'beauty',
  'animals',
  'education',
  'coding',
  'design',
  'cinema',
  'books',
  'coffee',
  'sunset',
  'city',
  'friends',
  'selfcare',
  'productivity',
  'goals',
  'success',
  'mindset',
  'habits',
  'inspiration',
  'adventure',
  'beach',
  'mountains',
  'roadtrip',
  'vacation',
  'explore',
  'singing',
  'guitar',
  'cover',
  'playlist',
  'hiphop',
  'kpop',
];

function randomTags(min = 3, max = 7) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  return [...TAGS_POOL].sort(() => Math.random() - 0.5).slice(0, count);
}

// ========== FETCH EXTERNAL DATA ==========

async function fetchUsers(count = 20) {
  const res = await axios.get(
    `https://randomuser.me/api/?results=${count}&nat=us,gb,fr,de,au`,
  );
  return res.data.results.map((u, i) => ({
    fullName: `${u.name.first} ${u.name.last}`,
    username: u.login.username.slice(0, 15),
    email: u.email,
    password: 'Test@123456',
    confirmPassword: 'Test@123456',
    phone: `0${['3', '5', '7', '8', '9'][i % 5]}${String(
      Math.floor(Math.random() * 100000000),
    ).padStart(8, '0')}`,
    dob: `${1980 + (i % 20)}-${String((i % 9) + 1).padStart(2, '0')}-15`,
    gender: u.gender.toUpperCase() === 'MALE' ? 'MALE' : 'FEMALE',
  }));
}

async function fetchPostCaptions(count = 50) {
  const res = await axios.get(
    `https://jsonplaceholder.typicode.com/posts?_limit=${count}`,
  );
  return res.data.map((p) => p.body.replace(/\n/g, ' ').slice(0, 200));
}

async function fetchImages(count = 50) {
  return Array.from(
    { length: count },
    (_, i) => `https://picsum.photos/seed/${i + 100}/800/600`,
  );
}

async function fetchVideos(count = 20) {
  if (!PEXELS_API_KEY) {
    console.warn('\n⚠️  Không có PEXELS_API_KEY, bỏ qua shorts');
    return [];
  }
  const res = await axios.get('https://api.pexels.com/videos/search', {
    headers: { Authorization: PEXELS_API_KEY },
    params: { query: 'lifestyle nature city people', per_page: count },
  });
  return res.data.videos.map((v) => ({
    url:
      v.video_files.find((f) => f.quality === 'sd')?.link ||
      v.video_files[0].link,
  }));
}

// ========== HELPERS ==========

async function downloadBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
}

// ========== SEED FUNCTIONS ==========

async function seedUsers(users) {
  console.log(`\n👤 Seeding ${users.length} users...`);
  const createdUsers = [];

  for (const user of users) {
    try {
      await axios.post(`${API_URL}/users/auth/register`, {
        email: user.email,
        password: user.password,
        confirmPassword: user.confirmPassword,
        fullName: user.fullName,
        username: user.username,
        phone: user.phone,
        dob: user.dob,
        gender: user.gender,
      });

      const loginRes = await axios.post(`${API_URL}/users/auth/login`, {
        email: user.email,
        password: user.password,
      });

      const token = loginRes.data.accessToken;
      createdUsers.push({ ...user, token });
      process.stdout.write('.');
    } catch (err) {
      process.stdout.write('x');
    }
  }

  console.log(`\n✅ Created ${createdUsers.length}/${users.length} users`);
  return createdUsers;
}

async function seedPosts(users, captions, images) {
  console.log(`\n📝 Seeding posts...`);
  let count = 0;

  for (const user of users) {
    if (!user.token) continue;

    const postCount = Math.floor(Math.random() * 3) + 2; // 2-4 posts/user

    for (let i = 0; i < postCount; i++) {
      try {
        const caption = captions[Math.floor(Math.random() * captions.length)];
        const imageCount = Math.floor(Math.random() * 3) + 1; // 1-3 ảnh
        const tags = randomTags();

        const form = new FormData();
        form.append('caption', caption);
        tags.forEach((tag) => form.append('tagsName[]', tag));

        // Download và append từng ảnh
        for (let j = 0; j < imageCount; j++) {
          const picsumUrl = images[Math.floor(Math.random() * images.length)];
          const buffer = await downloadBuffer(picsumUrl);
          form.append('files', buffer, {
            filename: `image-${j}.jpg`,
            contentType: 'image/jpeg',
          });
        }

        await axios.post(`${API_URL}/contents/post`, form, {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${user.token}`,
          },
        });

        count++;
        process.stdout.write('.');
      } catch (err) {
        process.stdout.write('x');
      }
    }
  }

  console.log(`\n✅ Created ${count} posts`);
}

async function seedShorts(users, videos) {
  console.log(`\n🎬 Seeding shorts...`);

  if (!videos.length) {
    console.log('⚠️  Bỏ qua shorts vì không có video');
    return;
  }

  let count = 0;
  const shortCaptions = [
    'Vibe check ✨',
    'POV: Monday morning 😅',
    'This hits different 🔥',
    'No cap this is fire 🚀',
    'Living my best life 💯',
    'When the beat drops 🎵',
    'Real ones know 👀',
    'Day in my life 🌅',
    "Can't stop won't stop 💪",
    'Mood 🌊',
  ];

  for (const user of users) {
    if (!user.token) continue;

    const shortCount = Math.floor(Math.random() * 2) + 1; // 1-2 shorts/user

    for (let i = 0; i < shortCount; i++) {
      try {
        const video = videos[Math.floor(Math.random() * videos.length)];
        const caption =
          shortCaptions[Math.floor(Math.random() * shortCaptions.length)];
        const tags = randomTags();

        // Download video và thumbnail
        const [videoBuffer, thumbnailBuffer] = await Promise.all([
          downloadBuffer(video.url),
          downloadBuffer(
            `https://picsum.photos/seed/${Math.floor(Math.random() * 100) + 300}/400/600`,
          ),
        ]);

        const form = new FormData();
        form.append('caption', caption);
        tags.forEach((tag) => form.append('tagsName[]', tag));
        form.append('fileVideo', videoBuffer, {
          filename: 'video.mp4',
          contentType: 'video/mp4',
        });
        form.append('fileThumbnail', thumbnailBuffer, {
          filename: 'thumbnail.jpg',
          contentType: 'image/jpeg',
        });

        await axios.post(`${API_URL}/contents/short`, form, {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${user.token}`,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });

        count++;
        process.stdout.write('.');
      } catch (err) {
        process.stdout.write('x');
      }
    }
  }

  console.log(`\n✅ Created ${count} shorts`);
}

async function seedFollows(users) {
  console.log(`\n👥 Seeding follows...`);
  let count = 0;

  for (const user of users) {
    if (!user.token) continue;

    const targets = users
      .filter((u) => u.username !== user.username)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 6) + 5); // follow 5-10 người

    for (const target of targets) {
      try {
        await axios.post(
          `${API_URL}/users/${target.username}/follow`,
          {},
          { headers: { Authorization: `Bearer ${user.token}` } },
        );
        count++;
      } catch (err) {
        // ignore duplicate follows
      }
    }
    process.stdout.write('.');
  }

  console.log(`\n✅ Created ${count} follows`);
}

// ========== MAIN ==========

async function main() {
  console.log('🌱 Starting seed...');
  console.log(`API: ${API_URL}\n`);

  try {
    console.log('📡 Fetching external data...');
    const [users, captions, images, videos] = await Promise.all([
      fetchUsers(20),
      fetchPostCaptions(50),
      fetchImages(50),
      fetchVideos(20),
    ]);
    console.log('✅ External data fetched');

    const createdUsers = await seedUsers(users);
    await seedPosts(createdUsers, captions, images);
    await seedShorts(createdUsers, videos);
    await seedFollows(createdUsers);

    console.log('\n\n🎉 Seed completed!');
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  }
}

main();
