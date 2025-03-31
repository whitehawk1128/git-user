import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { checkName } from "@/lib/checkName";
import { checkEmail } from "@/lib/checkEmail";
import { scrapeEmails } from "../scrap/route";
import checkSimilarity from "@/lib/checkSimilarity";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

export async function GET() {
  return NextResponse.json(
    {
      success: {
        message: "Good Success!",
      },
    },
    { status: 200 }
  );
}

export async function POST(req) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GitHub token is missing" }, { status: 500 });
  }

  try {
    const dataPath = path.join(process.cwd(), "public", "data.json");
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    const { location } = await req.json();
    if (!location || !(location in data)) {
      return NextResponse.json({ error: { message: "Invalid state or state not found in data.json" } }, { status: 400 });
    }
    
    const cities = data[location]; // Get cities from data.json
    let allUsers = [];

    for (const city of cities) {
      let hasNextPage = true;
      let afterCursor = null;

      while (hasNextPage) {
        const query = `
          query ($searchQuery: String!, $after: String) {
            search(query: $searchQuery, type: USER, first: 100, after: $after) {
              edges {
                node {
                  ... on User {
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
              }
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        `;

        const searchQuery = `location:"${city}"`;
        console.log(city);
        const response = await fetch(GITHUB_GRAPHQL_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, variables: { searchQuery, after: afterCursor } }),
        });

        const githubData = await response.json();
        if (!githubData || !githubData.data || !githubData.data.search) break;

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

        allUsers = [...allUsers, ...users];

        hasNextPage = githubData.data.search.pageInfo.hasNextPage;
        afterCursor = githubData.data.search.pageInfo.endCursor;
      }
    }

    return NextResponse.json({ users: allUsers }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}