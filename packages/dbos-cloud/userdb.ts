import axios, { AxiosError } from "axios";
import { isCloudAPIErrorResponse, handleAPIErrors, getCloudCredentials, getLogger } from "./cloudutils";
import { sleep } from "../../src/utils";

export interface UserDBInstance {
  readonly PostgresInstanceName: string;
  readonly Status: string;
  readonly HostName: string;
  readonly Port: number;
  readonly AdminUsername: string;
}

export async function createUserDb(host: string, dbName: string, adminName: string, adminPassword: string, sync: boolean) {
  const logger = getLogger();
  const userCredentials = getCloudCredentials();
  const bearerToken = "Bearer " + userCredentials.token;

  try {
    await axios.post(
      `https://${host}/v1alpha1/${userCredentials.userName}/databases/userdb`,
      { Name: dbName, AdminName: adminName, AdminPassword: adminPassword },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: bearerToken,
        },
      }
    );

    logger.info(`Successfully started provisioning database: ${dbName}`);

    if (sync) {
      let status = "";
      while (status != "available" && status != "backing-up") {
        await sleep(30000);
        const userDBInfo = await getUserDBInfo(host, dbName);
        logger.info(userDBInfo);
        status = userDBInfo.Status;
      }
    }
    logger.info(`Database successfully provisioned!`)
    return 0;
  } catch (e) {
    const errorLabel = `Failed to create database ${dbName}`;
    const axiosError = e as AxiosError;
    if (isCloudAPIErrorResponse(axiosError.response?.data)) {
        handleAPIErrors(errorLabel, axiosError);
    } else {
      logger.error(`${errorLabel}: ${(e as Error).message}`);
    }
    return 1;
  }
}

export async function deleteUserDb(host: string, dbName: string) {
  const logger = getLogger();
  const userCredentials = getCloudCredentials();
  const bearerToken = "Bearer " + userCredentials.token;

  try {
    await axios.delete(`https://${host}/v1alpha1/${userCredentials.userName}/databases/userdb/${dbName}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: bearerToken,
      },
    });
    logger.info(`Database deleted: ${dbName}`);
    return 0;
  } catch (e) {
    const errorLabel = `Failed to delete database ${dbName}`;
    const axiosError = e as AxiosError;
    if (isCloudAPIErrorResponse(axiosError.response?.data)) {
        handleAPIErrors(errorLabel, axiosError);
    } else {
      logger.error(`${errorLabel}: ${(e as Error).message}`);
    }
    return 1;
  }
}

export async function getUserDb(host: string, dbName: string, json: boolean) {
  const logger = getLogger();

  try {
    const userDBInfo = await getUserDBInfo(host, dbName);
    if (json) {
      console.log(JSON.stringify(userDBInfo));
    } else {
      console.log(`Postgres Instance Name: ${userDBInfo.PostgresInstanceName}`);
      console.log(`Status: ${userDBInfo.Status}`);
      console.log(`Host Name: ${userDBInfo.HostName}`);
      console.log(`Port: ${userDBInfo.Port}`);
      console.log(`Admin Username: ${userDBInfo.AdminUsername}`);
    }
    return 0;
  } catch (e) {
    const errorLabel = `Failed to retrieve database record ${dbName}`;
    const axiosError = e as AxiosError;
    if (isCloudAPIErrorResponse(axiosError.response?.data)) {
        handleAPIErrors(errorLabel, axiosError);
    } else {
      logger.error(`${errorLabel}: ${(e as Error).message}`);
    }
    return 1;
  }
}

export async function listUserDB(host: string, json: boolean) {
  const logger = getLogger();

  try {
    const userCredentials = getCloudCredentials();
    const bearerToken = "Bearer " + userCredentials.token;
  
    const res = await axios.get(`https://${host}/v1alpha1/${userCredentials.userName}/databases`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: bearerToken,
      },
    });

    const userDBs = res.data as UserDBInstance[];
    if (json) {
      console.log(JSON.stringify(userDBs));
    } else {
      if (userDBs.length === 0) {
        logger.info("No database instances found");
      }
      userDBs.forEach(userDBInfo => {
        console.log(`Postgres Instance Name: ${userDBInfo.PostgresInstanceName}`);
        console.log(`Status: ${userDBInfo.Status}`);
        console.log(`Host Name: ${userDBInfo.HostName}`);
        console.log(`Port: ${userDBInfo.Port}`);
        console.log(`Admin Username: ${userDBInfo.AdminUsername}`);
      });
    }
    return 0;
  } catch (e) {
    const errorLabel = `Failed to retrieve info`;
    const axiosError = e as AxiosError;
    if (isCloudAPIErrorResponse(axiosError.response?.data)) {
        handleAPIErrors(errorLabel, axiosError);
    } else {
      logger.error(`${errorLabel}: ${(e as Error).message}`);
    }
    return 1;
  }
}

export async function getUserDBInfo(host: string, dbName: string): Promise<UserDBInstance> {
  const userCredentials = getCloudCredentials();
  const bearerToken = "Bearer " + userCredentials.token;

  const res = await axios.get(`https://${host}/v1alpha1/${userCredentials.userName}/databases/userdb/info/${dbName}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: bearerToken,
    },
  });

  return res.data as UserDBInstance;
}
