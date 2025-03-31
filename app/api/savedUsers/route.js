import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET(req) {
  try {
    // Connect to the database
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "hacker",
      database: "saved_users", // Change this to your database name
    });

    // Fetch saved users from the database
    const [rows] = await connection.execute('SELECT * FROM users');

    // Close the connection
    await connection.end();

    return NextResponse.json({ users: rows }, { status: 200 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Unable to fetch saved users" }, { status: 500 });
  }
}