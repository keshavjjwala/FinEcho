import axios from "axios";

export default async function handler(req, res) {
  console.log("Backend started");
  console.log("Base URL:", process.env.BACKBOARD_BASE_URL);

  try {
    const response = await axios.get(
      `${process.env.BACKBOARD_BASE_URL}/v1/threads?limit=10`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BACKBOARD_API_KEY}`,
        },
        timeout: 10000,
      }
    );

    res.status(200).json({
      success: true,
      data: response.data,
    });

  } catch (error) {
    console.error("Backboard API call failed ❌");

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}
