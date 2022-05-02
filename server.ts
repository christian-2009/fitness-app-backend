import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { Client } from "pg";

//As your database is on your local machine, with default port,
//and default username and password,
//we only need to specify the (non-default) database name.
config();
const PORT_NUMBER = 4000;
const herokuSSLSetting = { rejectUnauthorized: false };
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting;

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();
app.use(express.json());
app.use(cors());

const client = new Client(dbConfig);
client.connect();

/**
 * Simplest way to connect a front-end. Unimportant detail right now, although you can read more: https://flaviocopes.com/express-cors/
 */

app.get("/weights", async (req, res) => {
  const weights = await client.query(
    "select * from weight order by dates desc "
  );
  res.json(weights.rows);
});

app.get("/weights/:id", async (req, res) => {
  const weight = await client.query("SELECT * FROM weight WHERE id = $1", [
    req.params.id,
  ]);
  res.json(weight.rows)
});

app.post("/weights", async (req, res) => {
  const { weight } = req.body;
  if (typeof weight === "string") {
    await client.query(
      "INSERT INTO weight (weight, dates) VALUES ($1, current_timestamp)",
      [weight]
    );
    res.status(201).json({status: "success"}
    );
  }
});

// app.put("/signatures/:id", async (req, res) => {
//   //  :id refers to a route parameter, which will be made available in req.params.id
//   const { name, message } = req.body;
//   const id = parseInt(req.params.id);
//   if (typeof name === "string") {
//     const result: any = await client.query(
//       "UPDATE signatures SET signature = $1, message = $2 WHERE id = $3",
//       [name, message, id]
//     ); //FIXME-TASK: update the signature with given id in the DB.

//     if (result.rowCount === 1) {
//       const updatedSignature = result.rows[0];
//       res.status(200).json({
//         status: "success",
//         data: {
//           signature: updatedSignature,
//         },
//       });
//     } else {
//       res.status(404).json({
//         status: "fail",
//         data: {
//           id: "Could not find a signature with that id identifier",
//         },
//       });
//     }
//   } else {
//     res.status(400).json({
//       status: "fail",
//       data: {
//         name: "A string value for name is required in your JSON body",
//       },
//     });
//   }
// });

app.listen(PORT_NUMBER, () => {
  console.log(`Server is listening on port ${PORT_NUMBER}!`);
});

export default app;
