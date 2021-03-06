import { enableFetchMocks, disableFetchMocks } from 'jest-fetch-mock';

const RealDate = global.Date;
const LAST_RESPONSE_DATA_KEY = 'codexporer.io-request_country-last_respose_data';
const LAST_RESPONSE_TIME_KEY = 'codexporer.io-request_country-last_respose_time';

describe('request-country', () => {
    const defaultOptions = {
        saveData: jest.fn(),
        loadData: jest.fn(),
        retentionInMs: 1000
    };
    const mockGetTime = jest.fn();
    const mockGetPreviousTime = jest.fn();
    const defaultFetchedData = {
        code: 'AUS',
        isoCode: 'AU',
        name: 'Australia'
    };
    const defaultCachedData = {
        code: 'MCK',
        isoCode: 'MK',
        name: 'Mock'
    };
    const defaultResponse = '1;AU;AUS;Australia';
    let initialize;
    let requestCountry;

    beforeAll(() => {
        enableFetchMocks();
        jest.useFakeTimers();
        // eslint-disable-next-line func-names
        global.Date = function (arg) {
            if (arg) {
                this.getTime = mockGetPreviousTime;
            } else {
                this.getTime = mockGetTime;
            }

            this.toISOString = () => `ISO-${this.getTime()}`;
        };
    });

    beforeEach(() => {
        jest.isolateModules(() => {
            // eslint-disable-next-line global-require
            const module = require('./index');
            initialize = module.initialize;
            requestCountry = module.requestCountry;
        });
        jest.clearAllMocks();
        jest.clearAllTimers();
        fetch.resetMocks();
        mockGetTime.mockReset();
        mockGetPreviousTime.mockReset();
        defaultOptions.loadData.mockReset();
        defaultOptions.saveData.mockReset();
    });

    afterAll(() => {
        disableFetchMocks();
        jest.useRealTimers();
        global.Date = RealDate;
    });

    it('should return fetched data when cache is empty', async () => {
        fetch.mockResponse(defaultResponse);
        mockGetTime.mockReturnValue(123);
        initialize(defaultOptions);

        const result = await requestCountry();

        expect(result).toEqual(defaultFetchedData);
        expect(defaultOptions.loadData).toHaveBeenCalledTimes(2);
        expect(defaultOptions.loadData).toHaveBeenNthCalledWith(
            1,
            LAST_RESPONSE_DATA_KEY
        );
        expect(defaultOptions.loadData).toHaveBeenNthCalledWith(
            2,
            LAST_RESPONSE_TIME_KEY
        );
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('https://ip2c.org/s');
        expect(defaultOptions.saveData).toHaveBeenCalledTimes(2);
        expect(defaultOptions.saveData).toHaveBeenNthCalledWith(
            1,
            LAST_RESPONSE_DATA_KEY,
            JSON.stringify(defaultFetchedData)
        );
        expect(defaultOptions.saveData).toHaveBeenNthCalledWith(
            2,
            LAST_RESPONSE_TIME_KEY,
            'ISO-123'
        );
    });

    it('should return fetched data after retention period pass', async () => {
        fetch.mockResponse(defaultResponse);
        defaultOptions.loadData.mockImplementation(
            key => key === LAST_RESPONSE_DATA_KEY ? JSON.stringify(defaultCachedData) : 100
        );
        mockGetTime.mockReturnValue(1200);
        mockGetPreviousTime.mockReturnValue(100);
        initialize(defaultOptions);

        const result = await requestCountry();

        expect(result).toEqual(defaultFetchedData);
        expect(defaultOptions.loadData).toHaveBeenCalledTimes(2);
        expect(defaultOptions.loadData).toHaveBeenNthCalledWith(
            1,
            LAST_RESPONSE_DATA_KEY
        );
        expect(defaultOptions.loadData).toHaveBeenNthCalledWith(
            2,
            LAST_RESPONSE_TIME_KEY
        );
        expect(defaultOptions.saveData).toHaveBeenCalledTimes(2);
        expect(defaultOptions.saveData).toHaveBeenNthCalledWith(
            1,
            LAST_RESPONSE_DATA_KEY,
            JSON.stringify(defaultFetchedData)
        );
        expect(defaultOptions.saveData).toHaveBeenNthCalledWith(
            2,
            LAST_RESPONSE_TIME_KEY,
            'ISO-1200'
        );
    });

    it('should return cached data after retention period pass when fetch returns incorrect response', async () => {
        fetch.mockResponse('123');
        defaultOptions.loadData.mockImplementation(
            key => key === LAST_RESPONSE_DATA_KEY ? JSON.stringify(defaultCachedData) : 100
        );
        mockGetTime.mockReturnValue(1200);
        mockGetPreviousTime.mockReturnValue(100);
        initialize(defaultOptions);

        const result = await requestCountry();

        expect(result).toEqual(defaultCachedData);
        expect(defaultOptions.loadData).toHaveBeenCalledTimes(2);
        expect(defaultOptions.loadData).toHaveBeenNthCalledWith(
            1,
            LAST_RESPONSE_DATA_KEY
        );
        expect(defaultOptions.loadData).toHaveBeenNthCalledWith(
            2,
            LAST_RESPONSE_TIME_KEY
        );
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(defaultOptions.saveData).not.toHaveBeenCalled();
    });

    it('should return null when no cache and fetch returns incorrect response', async () => {
        fetch.mockResponse('123');
        mockGetTime.mockReturnValue(123);
        initialize(defaultOptions);

        const result = await requestCountry();

        expect(result).toBe(null);
        expect(defaultOptions.loadData).toHaveBeenCalledTimes(2);
        expect(defaultOptions.loadData).toHaveBeenNthCalledWith(
            1,
            LAST_RESPONSE_DATA_KEY
        );
        expect(defaultOptions.loadData).toHaveBeenNthCalledWith(
            2,
            LAST_RESPONSE_TIME_KEY
        );
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(defaultOptions.saveData).not.toHaveBeenCalled();
    });

    it('should return cached data after retention period pass when fetch errors', async () => {
        fetch.mockReject(new Error('mock error'));
        defaultOptions.loadData.mockImplementation(
            key => key === LAST_RESPONSE_DATA_KEY ? JSON.stringify(defaultCachedData) : 100
        );
        mockGetTime.mockReturnValue(1200);
        mockGetPreviousTime.mockReturnValue(100);
        initialize(defaultOptions);

        const result = await requestCountry();

        expect(result).toEqual(defaultCachedData);
        expect(defaultOptions.loadData).toHaveBeenCalledTimes(2);
        expect(defaultOptions.loadData).toHaveBeenNthCalledWith(
            1,
            LAST_RESPONSE_DATA_KEY
        );
        expect(defaultOptions.loadData).toHaveBeenNthCalledWith(
            2,
            LAST_RESPONSE_TIME_KEY
        );
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(defaultOptions.saveData).not.toHaveBeenCalled();
    });

    it('should return null when no cache and fetch errors', async () => {
        fetch.mockReject(new Error('mock error'));
        mockGetTime.mockReturnValue(123);
        initialize(defaultOptions);

        const result = await requestCountry();

        expect(result).toBe(null);
        expect(defaultOptions.loadData).toHaveBeenCalledTimes(2);
        expect(defaultOptions.loadData).toHaveBeenNthCalledWith(
            1,
            LAST_RESPONSE_DATA_KEY
        );
        expect(defaultOptions.loadData).toHaveBeenNthCalledWith(
            2,
            LAST_RESPONSE_TIME_KEY
        );
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(defaultOptions.saveData).not.toHaveBeenCalled();
    });

    it('should return cached data before retention period pass', async () => {
        defaultOptions.loadData.mockImplementation(
            key => key === LAST_RESPONSE_DATA_KEY ? JSON.stringify(defaultCachedData) : 100
        );
        mockGetTime.mockReturnValue(900);
        mockGetPreviousTime.mockReturnValue(100);
        initialize(defaultOptions);

        const result = await requestCountry();

        expect(result).toEqual(defaultCachedData);
        expect(defaultOptions.loadData).toHaveBeenCalledTimes(2);
        expect(defaultOptions.loadData).toHaveBeenNthCalledWith(
            1,
            LAST_RESPONSE_DATA_KEY
        );
        expect(defaultOptions.loadData).toHaveBeenNthCalledWith(
            2,
            LAST_RESPONSE_TIME_KEY
        );
        expect(fetch).not.toHaveBeenCalled();
        expect(defaultOptions.saveData).not.toHaveBeenCalled();
    });

    it('should throw an error if module is not initialized', async () => {
        await expect(requestCountry).rejects.toThrow('Module is not initialized.');
        expect(defaultOptions.loadData).not.toHaveBeenCalled();
        expect(fetch).not.toHaveBeenCalled();
        expect(defaultOptions.saveData).not.toHaveBeenCalled();
    });
});
