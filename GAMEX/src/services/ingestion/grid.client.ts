import axios from "axios";

const GRID_URL = "https://api.grid.gg/central-data/graphql";

export async function gridQuery(query: string, variables = {}) {
  try {
    const res = await axios.post(
      GRID_URL,
      { query, variables },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.GRID_API_KEY // ✅ FIXED
        }
      }
    );

    return res.data;
  } catch (err: any) {
    console.error("[GRID ERROR]", err.response?.data || err.message);
    throw err;
  }
}
