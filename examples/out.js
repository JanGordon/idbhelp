(() => {
  // lib.ts
  var DB = class {
    constructor(dbName) {
      this.storesToCreate = [];
      this.dbName = dbName;
    }
    open(dbName) {
      return new Promise((res, rej) => {
        this.dbName = dbName;
        if (this.idb) {
          if (this.storesToCreate.length > 0) {
            let actualStoresToMake = [];
            for (let storeName of this.storesToCreate) {
              if (this.idb.objectStoreNames.contains(storeName)) {
              } else {
                actualStoresToMake.push(storeName);
              }
            }
            if (actualStoresToMake.length > 0) {
              this.idb.close();
              let d = indexedDB.open(dbName, this.idb.version + 1);
              d.onupgradeneeded = () => {
                this.idb = d.result;
                for (let storeName of actualStoresToMake) {
                  this.idb.createObjectStore(storeName);
                }
                this.storesToCreate = [];
              };
              d.onsuccess = () => {
                res();
              };
            } else {
              res();
            }
          } else {
            res();
          }
        } else {
          let openTrans = indexedDB.open(dbName);
          openTrans.onsuccess = () => {
            this.idb = openTrans.result;
            this.open(dbName).then(() => {
              res();
            });
          };
        }
      });
    }
    createStore(storeName) {
      this.storesToCreate.push(storeName);
    }
    putInStore(storeName, key, data) {
      return new Promise((res) => {
        this.open(this.dbName).then(() => {
          if (this.idb.objectStoreNames.contains(storeName)) {
            let obStore = this.idb.transaction(storeName, "readwrite").objectStore(storeName);
            obStore.put(data, key);
          }
        });
      });
    }
    getFromStore(storeName, key) {
      return new Promise((res, rej) => {
        this.open(this.dbName).then(() => {
          if (this.idb.objectStoreNames.contains(storeName)) {
            let obStore = this.idb.transaction(storeName, "readwrite").objectStore(storeName);
            let transaction = obStore.get(key);
            transaction.onsuccess = () => {
              res(transaction.result);
            };
            transaction.onerror = () => {
              rej(transaction.result);
            };
          }
        });
      });
    }
  };

  // examples/main.ts
  var db = new DB("idbhelpertest");
  db.createStore("people");
  var personName = document.getElementById("name");
  var gender = document.getElementById("gender");
  var age = document.getElementById("age");
  document.getElementById("add")?.addEventListener("click", async () => {
    await db.putInStore("people", personName.value, { age: age.value, gender: gender.value });
  });
  var showName = document.getElementById("show-name");
  var peopleDiv = document.getElementById("people");
  document.getElementById("show")?.addEventListener("click", async () => {
    peopleDiv.innerHTML = JSON.stringify(await db.getFromStore("people", showName.value));
  });
})();
