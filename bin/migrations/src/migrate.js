const got = require("got");
const getToken =  require('./util/auth');

(async () =>{
    const token = await getToken();
    await got.get("http://localhost:3005/v1/bling/migration", {
            headers: {
              authorization: `Bearer ${token}`,
            },
            responseType: "json",
          });
    console.log("Products and Orders was sending with successful");
})().catch(err=>console.log(err));