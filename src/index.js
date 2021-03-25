import split from 'lodash/split';

const LAST_RESPONSE_DATA_KEY = 'codexporer.io-request_country-last_respose_data';
const LAST_RESPONSE_TIME_KEY = 'codexporer.io-request_country-last_respose_time';

let options = null;

export const initialize = ({
    saveData,
    loadData,
    retentionInMs
}) => {
    options = {
        saveData,
        loadData,
        retentionInMs
    };
};

export const requestCountry = async () => {
    if (!options) {
        throw new Error('Module is not initialized.');
    }

    const {
        saveData,
        loadData,
        retentionInMs
    } = options;

    const lastResponseData = await loadData(LAST_RESPONSE_DATA_KEY);
    const lastResponseTime = await loadData(LAST_RESPONSE_TIME_KEY);

    if (
        lastResponseData &&
        lastResponseTime &&
        new Date().getTime() - new Date(lastResponseTime).getTime() < retentionInMs
    ) {
        return JSON.parse(lastResponseData);
    }

    try {
        const response = await fetch('https://ip2c.org/s');
        const content = await response.text();
        const parsedContent = split(content, ';');
        if (parsedContent[0] !== '1') {
            throw new Error('Country can not be determined.');
        }

        const data = {
            code: parsedContent[2],
            isoCode: parsedContent[1],
            name: parsedContent[3]
        };

        await Promise.all([
            saveData(LAST_RESPONSE_DATA_KEY, JSON.stringify(data)),
            saveData(LAST_RESPONSE_TIME_KEY, new Date().toISOString())
        ]);

        return data;
    } catch {
        return lastResponseData ? JSON.parse(lastResponseData) : null;
    }
};
