import axios , { AxiosError } from "axios";
import { handleAPIErrors, getCloudCredentials, getLogger, isCloudAPIErrorResponse, retrieveApplicationName } from "../cloudutils";
import { Application, prettyPrintApplication } from "./types";

export async function getAppInfo(host: string, json: boolean): Promise<number> {
  const logger = getLogger();
  const userCredentials = getCloudCredentials();
  const bearerToken = "Bearer " + userCredentials.token;

  const appName = retrieveApplicationName(logger, json);
  if (appName === null) {
    return 1;
  }
  if (!json) {
    logger.info(`Retrieving info for application: ${appName}`)
  }

  try {
    const res = await axios.get(`https://${host}/v1alpha1/${userCredentials.userName}/applications/${appName}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: bearerToken,
      }
    });
    const app = res.data as Application
    if (json) {
      console.log(JSON.stringify(app));
    } else {
      prettyPrintApplication(app);
    }
    return 0;
  } catch (e) {
    const errorLabel = `Failed to retrieve info for application ${appName}`;
    const axiosError = e as AxiosError;
    if (isCloudAPIErrorResponse(axiosError.response?.data)) {
      handleAPIErrors(errorLabel, axiosError);
    } else {
      logger.error(`${errorLabel}: ${(e as Error).message}`);
    }
    return 1;
  }
}
