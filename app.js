const CLIENT_ID = '';  
const CLIENT_SECRET = '';  
const TOKEN_ENDPOINT = 'https://login.inrupt.com/token';
const POD_URI = '';

async function getAccessToken() {
  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'grant_type': 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error(`Ошибка получения токена: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchResourceFromPod(accessToken) {
  const path = document.getElementById("path").value;
  
  const response = await fetch(POD_URI + path, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Ошибка доступа: ${response.statusText}`);
  }

  return response.text();
}

async function updateProfile(accessToken, name, age) {
  const sparqlUpdate = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    DELETE {
      <https://storage.inrupt.com/72b370b9-3af7-4007-a04c-ef34287bd999/profile#me> foaf:name ?oldName ;
        foaf:age ?oldAge .
    }
    INSERT {
      <https://storage.inrupt.com/72b370b9-3af7-4007-a04c-ef34287bd999/profile#me> foaf:name "${name}" ;
        foaf:age "${age}" .
    }
    WHERE {
      OPTIONAL {
        <https://storage.inrupt.com/72b370b9-3af7-4007-a04c-ef34287bd999/profile#me> foaf:name ?oldName ;
          foaf:age ?oldAge .
      }
    }
  `;

  const response = await fetch(POD_URI + 'profile', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/sparql-update',
    },
    body: sparqlUpdate,
  });

  if (!response.ok) {
    throw new Error(`Ошибка обновления профиля: ${response.statusText}`);
  }

  return 'Профиль обновлён успешно!';
}



document.getElementById("getAccessToken").addEventListener("click", async () => {
  const output = document.getElementById("output");
  output.textContent = "Получение токена";
  
  try {
    const accessToken = await getAccessToken();
    output.textContent = `Токен получен: ${accessToken}`;
    document.getElementById("fetchResource").disabled = false;
    document.getElementById("updateProfile").disabled = false;
  
    window.solidAccessToken = accessToken;
  } catch (error) {
    output.textContent = error.message;
  }
});

document.getElementById("fetchResource").addEventListener("click", async () => {
  const output = document.getElementById("output");
  output.textContent = "Получение";

  try {
    const resource = await fetchResourceFromPod(window.solidAccessToken);
    output.textContent = `Данные:\n${resource}`;
  } catch (error) {
    output.textContent = error.message;
  }
});

document.getElementById("updateProfile").addEventListener("click", async () => {
  const output = document.getElementById("output");
  output.textContent = "Обновление профиля";

  const name = document.getElementById("name").value;
  const age = document.getElementById("age").value;

  try {
    const result = await updateProfile(window.solidAccessToken, name, age);
    output.textContent = result;
  } catch (error) {
    output.textContent = error.message;
  }
});

