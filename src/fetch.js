const address = "http://localhost:3001";
// const address = "/server";
const makeError = response =>{
    const err = new Error(response.statusText);
    err.status = response.status;
    return err;
}
const q = (url, options) => 
    new Promise((resolve, reject)=>
        fetch(`${address}${url}`, { 
            credentials: 'include', 
            ...options, 
            headers: {
                'Content-Type': 'application/json',
                ...(options?.headers||{}), 
              },
            body: options?.body?JSON.stringify(options.body):undefined 
        })
            .then(res=>{
                switch(res.status)
                {
                    case 200:
                        return res.json();
                    case 204: 
                        return {};
                    case 401:
                        throw makeError(res)
                }
            })
            .then(resolve)
            .catch(reject)
    );
q.address = address;
export default q;