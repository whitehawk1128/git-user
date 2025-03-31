import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

// Utility function for retrying with exponential backoff
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchUsersForCity = async (city, retryCount = 0, afterCursor = null) => {
  let allUsers = [];
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      const query = `
        query ($query: String!, $after: String) {
          search(query: $query, type: USER, first: 100, after: $after) {
            edges {
              node {
                id
                login
                name
                email
                avatarUrl
                createdAt
                websiteUrl
                repositories {
                  totalCount
                }
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      `;

      // ✅ Fix: Removed `type:user` to avoid filtering issues
      const searchQuery = `location:"${city}"`;
      console.log(`Fetching users from: ${city} (Cursor: ${afterCursor || "Start"})`);

      const response = await fetch(GITHUB_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "YourAppName",
        },
        body: JSON.stringify({ query, variables: { query: searchQuery, after: afterCursor } }),
      });

      if (!response.ok) {
        console.error(`GitHub API Error: ${response.status} - ${response.statusText}`);

        if (response.status === 403) {
          const resetTime = response.headers.get("X-RateLimit-Reset");
          const waitTime = resetTime ? (resetTime * 1000 - Date.now()) : 60000;
          console.log(`Rate limit hit. Retrying after ${waitTime / 1000} seconds...`);
          await delay(waitTime);
          return fetchUsersForCity(city, retryCount, afterCursor);
        }

        throw new Error(`GitHub API error: ${response.status}`);
      }

      const githubData = await response.json();

      // ✅ Fix: Proper error handling for API response
      if (!githubData?.data || !githubData.data.search) {
        console.log(`⚠️ Invalid response for ${city}:`, JSON.stringify(githubData, null, 2));
        break;
      }

      const users = githubData.data.search.edges.map(({ node }) => ({
        id: node.id,
        login: node.login,
        name: node.name || "N/A",
        email: node.email || "N/A",
        avatarUrl: node.avatarUrl,
        createdAt: node.createdAt,
        websiteUrl: node.websiteUrl || "N/A",
        repositories: { totalCount: node.repositories?.totalCount || 0 },
      }));

      if (users.length === 0) {
        console.log(`No users found for ${city}`);
        break;
      }

      allUsers.push(...users);
      hasNextPage = githubData.data.search.pageInfo.hasNextPage;
      afterCursor = githubData.data.search.pageInfo.endCursor || null;

    } catch (error) {
      console.error(`❌ Error fetching ${city}:`, error);

      if (retryCount < 3) {
        const waitTime = 1000 * Math.pow(2, retryCount);
        console.log(`Retrying (${retryCount + 1}/3) after ${waitTime / 1000} seconds...`);
        await delay(waitTime);
        return fetchUsersForCity(city, retryCount + 1, afterCursor);
      }

      return allUsers;
    }
  }

  return allUsers;
};

export async function POST(req) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GitHub token is missing" }, { status: 500 });
  }

  try {
    const dataPath = path.join(process.cwd(), "public", "data.json");

    // ✅ Fix: Error handling for `data.json`
    let data;
    try {
      data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    } catch (err) {
      console.error("❌ Error reading data.json:", err);
      return NextResponse.json({ error: "Error reading data file" }, { status: 500 });
    }

    const { location } = await req.json();
    if (!location || !(location in data)) {
      return NextResponse.json({ error: { message: "Invalid state or state not found in data.json" } }, { status: 400 });
    }

    const cities = data[location];
    const CONCURRENCY_LIMIT = 5;
    let allUsers = [];

    for (let i = 0; i < cities.length; i += CONCURRENCY_LIMIT) {
      const chunk = cities.slice(i, i + CONCURRENCY_LIMIT);
      const usersPerChunk = await Promise.allSettled(chunk.map(fetchUsersForCity));

      allUsers.push(...usersPerChunk.flatMap(result => result.status === "fulfilled" ? result.value : []));

      if (i + CONCURRENCY_LIMIT < cities.length) {
        console.log("Waiting 5 seconds before next batch...");
        await delay(5000);
      }
    }

    return NextResponse.json({ users: allUsers }, { status: 200 });
  } catch (error) {
    console.error("❌ Internal Server Error:", error);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}