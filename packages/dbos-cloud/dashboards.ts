import axios, { AxiosError } from "axios";
import { getLogger, getCloudCredentials, isCloudAPIErrorResponse, handleAPIErrors } from "./cloudutils";

export async function launchDashboard(host: string): Promise<number> {
    const logger = getLogger();
    const userCredentials = getCloudCredentials();
    const bearerToken = "Bearer " + userCredentials.token;
    try{
        const res = await axios.put(`https://${host}/v1alpha1/${userCredentials.userName}/dashboard`,
        {},
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: bearerToken,
            }
        });
        logger.info(`Dashboard ready at ${res.data}`)
        return 0
    } catch (e) {
        const errorLabel = `Failed to initialize dashboard`;
        const axiosError = e as AxiosError;
        if (isCloudAPIErrorResponse(axiosError.response?.data)) {
            handleAPIErrors(errorLabel, axiosError);
        } else {
            logger.error(`${errorLabel}: ${(e as Error).message}`);
        }
    }
    return 1;
  }
