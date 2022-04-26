import express from "express";
import cors from "cors";
const { Client } = require("pg");
// const Client = require('pg').Client;
// import pg from 'pg';
// const Client = pg.Client;
// const Client = require('pg')

//As your database is on your local machine, with default port,
//and default username and password,
//we only need to specify the (non-default) database name.
const PORT_NUMBER = 4000;
const client = new Client({ database: "fitness-app-db" });

//TODO: this request for a connection will not necessarily complete before the first HTTP request is made!
client.connect();

const app = express();

/**
 * Simplest way to connect a front-end. Unimportant detail right now, although you can read more: https://flaviocopes.com/express-cors/
 */
app.use(cors());

/**
 * Middleware to parse a JSON body in requests
 */
app.use(express.json());

//When this route is called, return the most recent 100 signatures in the db
app.get("/weights", async (req, res) => {
  const weights = await client.query("SELECT * FROM weight "); //FIXME-TASK: get signatures from db!
  res.send(weights.rows)
});

app.get("/weights/:id", async (req, res) => {
  const weight = await client.query("SELECT * FROM weight WHERE id = $1", [
    req.params.id,
  ]);
  res.status(200).json({
    status: "success",
    data: {
      weight,
    },
  });
});

app.get("/signatures/:id", async (req, res) => {
  // :id indicates a "route parameter", available as req.params.id
  //  see documentation: https://expressjs.com/en/guide/routing.html
  const id = parseInt(req.params.id); // params are always string type

  const signature = await client.query(
    "SELECT * FROM signatures WHERE id = $1",
    [id]
  ); //FIXME-TASK get the signature row from the db (match on id)

  if (signature) {
    res.status(200).json({
      status: "success",
      data: {
        signature,
      },
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a signature with that id identifier",
      },
    });
  }
});

app.post("/weights", async (req, res) => {
  const { weight } = req.body;
  if (typeof weight === "string") {
    const createdSignature = await client.query(
      "INSERT INTO weight (weight, dates) VALUES ($1, current_timestamp)",
      [weight]
    ); //FIXME-TASK: insert the supplied signature object into the DB

    res.status(201).json({
      status: "success",
      data: {
        signature: createdSignature, //return the relevant data (including its db-generated id)
      },
    });
  } else {
    res.status(400).json({
      status: "fail",
      data: {
        name: "A string value for name is required in your JSON body",
      },
    });
  }
});

//update a signature.
app.put("/signatures/:id", async (req, res) => {
  //  :id refers to a route parameter, which will be made available in req.params.id
  const { name, message } = req.body;
  const id = parseInt(req.params.id);
  if (typeof name === "string") {
    const result: any = await client.query(
      "UPDATE signatures SET signature = $1, message = $2 WHERE id = $3",
      [name, message, id]
    ); //FIXME-TASK: update the signature with given id in the DB.

    if (result.rowCount === 1) {
      const updatedSignature = result.rows[0];
      res.status(200).json({
        status: "success",
        data: {
          signature: updatedSignature,
        },
      });
    } else {
      res.status(404).json({
        status: "fail",
        data: {
          id: "Could not find a signature with that id identifier",
        },
      });
    }
  } else {
    res.status(400).json({
      status: "fail",
      data: {
        name: "A string value for name is required in your JSON body",
      },
    });
  }
});

app.delete("/signatures/:id", async (req, res) => {
  const id = parseInt(req.params.id); // params are string type

  const queryResult: any = await client.query(
    "DELETE FROM signatures WHERE id = $1",
    [id]
  ); ////FIXME-TASK: delete the row with given id from the db
  const didRemove = queryResult.rowCount === 1;

  if (didRemove) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE#responses
    // we've gone for '200 response with JSON body' to respond to a DELETE
    //  but 204 with no response body is another alternative:
    //  res.status(204).send() to send with status 204 and no JSON body
    res.status(200).json({
      status: "success",
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a signature with that id identifier",
      },
    });
  }
});

app.listen(PORT_NUMBER, () => {
  console.log(`Server is listening on port ${PORT_NUMBER}!`);
});

export default app;
