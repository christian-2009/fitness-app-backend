import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { Client } from "pg";

//As your database is on your local machine, with default port,
//and default username and password,
//we only need to specify the (non-default) database name.
config();

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

app.get("/", async (req, res) => {
  res.json({ status: "app is listening" });
});

app.get("/weights", async (req, res) => {
  const weights = await client.query(
    "select * from weight order by dates desc "
  );
  res.set('Access-Control-Allow-Origin', '*')
  res.json(weights.rows);
});

app.get('/weights/goals', async (req,res) => {
  const goalWeight = await client.query('select * from weight where type = $1', ['goal'])
  res.set('Access-Control-Allow-Origin', '*')
  res.json(goalWeight.rows)
})

app.get("/weights/:id", async (req, res) => {
  const weight = await client.query("select * from weight where id = $1 and type = $2" , [
    req.params.id, 'weight'
  ]);
  res.set('Access-Control-Allow-Origin', '*')
  res.json(weight.rows);
});

app.post("/weights", async (req, res) => {
  const { weight, type} = req.body;
  if (typeof weight === "string") {
    await client.query(
      "insert into weight (weight, dates, type) values ($1, now(), $2)",
      [weight, type]
    );
    res.status(201).json({ status: "success" });
  }
});

app.put("/weights/goals", async (req, res) => {
  const {weight} = req.body
  if (typeof weight === "string") {
    await client.query('update weight set weight = $1 WHERE type = $2', [weight, 'goal']);
  res.status(201).json({ status: "success"})
}
})

app.delete("/weights/:id", async (req, res) => {
  const id = req.params.id;
  await client.query("delete from weight where id = $1", [id]);
  res.json({ status: "success" });
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

const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}

app.listen(port, () => {
  console.log(`Server is listening on port ${port}!`);
});

export default app;
