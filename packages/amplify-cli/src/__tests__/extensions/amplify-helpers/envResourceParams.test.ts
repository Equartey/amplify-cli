import * as fs from 'fs-extra';
import {
  pathManager, stateManager, $TSContext,
} from 'amplify-cli-core';
import { getEnvInfo } from '../../../extensions/amplify-helpers/get-env-info';
import {
  saveEnvResourceParameters,
  loadEnvResourceParameters,
  removeResourceParameters,
} from '../../../extensions/amplify-helpers/envResourceParams';

jest.mock('fs-extra');
jest.mock('amplify-cli-core', () => ({
  pathManager: { getTeamProviderInfoFilePath: jest.fn() },
  stateManager: {
    getTeamProviderInfo: jest.fn(),
    setTeamProviderInfo: jest.fn(),
    getLocalEnvInfo: jest.fn().mockReturnValue({ envName: 'testEnv' }),
  },
}));
jest.mock('../../../extensions/amplify-helpers/get-env-info', () => ({ getEnvInfo: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  (fs.existsSync as any).mockReturnValue(true);
  (getEnvInfo as any).mockReturnValue({ envName: 'testEnv' });
  (pathManager.getTeamProviderInfoFilePath as any).mockReturnValue('test/path');
});

test('saveEnvResourceParams appends to existing params', () => {
  const contextStub = {};
  const existingParams = {
    testEnv: {
      awscloudformation: {
        StackId:
          // eslint-disable-next-line spellcheck/spell-checker
          'arn:aws:cloudformation:us-east-1:1234567891011:stack/amplify-teamprovider-dev-134909/df33f4d0-1895-11eb-a8b4-0e706f74ed45',
      },
      categories: {
        testCategory: {
          testResourceName: {
            existingParam: 'existingParamValue',
          },
        },
      },
    },
  };
  (stateManager.getTeamProviderInfo as any).mockReturnValue(existingParams);

  saveEnvResourceParameters((contextStub as unknown) as $TSContext, 'testCategory', 'testResourceName', { newParam: 'newParamValue' });

  const setTeamProviderInfoMock: any = stateManager.setTeamProviderInfo;
  expect(setTeamProviderInfoMock).toHaveBeenCalled();
  const callParams = setTeamProviderInfoMock.mock.calls[0];
  // expect(callParams[0]).toEqual('test/path');
  const expectedParams = {
    testEnv: {
      awscloudformation: {
        StackId:
          // eslint-disable-next-line spellcheck/spell-checker
          'arn:aws:cloudformation:us-east-1:1234567891011:stack/amplify-teamprovider-dev-134909/df33f4d0-1895-11eb-a8b4-0e706f74ed45',
      },
      categories: {
        testCategory: {
          testResourceName: {
            existingParam: 'existingParamValue',
            newParam: 'newParamValue',
          },
        },
      },
    },
  };
  expect(callParams[1]).toEqual(expectedParams);
});

test('loadEnvResourceParameters load params from deployment secrets and team provider info', () => {
  const contextStub = {};
  const existingParams = {
    testEnv: {
      awscloudformation: {
        StackId:
          // eslint-disable-next-line spellcheck/spell-checker
          'arn:aws:cloudformation:us-east-1:1234567891011:stack/amplify-teamprovider-dev-134909/df33f4d0-1895-11eb-a8b4-0e706f74ed45',
      },
      categories: {
        testCategory: {
          testResourceName: {
            existingParam: 'existingParamValue',
          },
        },
      },
    },
  };

  const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
  stateManagerMock.getTeamProviderInfo.mockReturnValue(existingParams);

  const params = loadEnvResourceParameters((contextStub as unknown) as $TSContext, 'testCategory', 'testResourceName');

  expect(params).toEqual({
    existingParam: 'existingParamValue',
  });

  expect(stateManagerMock.getTeamProviderInfo).toHaveBeenCalled();
});

test('removeResourceParameters remove resource params from team provider info', () => {
  const contextStub = {};
  const existingParams = {
    testEnv: {
      awscloudformation: {
        StackId:
          // eslint-disable-next-line spellcheck/spell-checker
          'arn:aws:cloudformation:us-east-1:1234567891011:stack/amplify-teamprovider-dev-134909/df33f4d0-1895-11eb-a8b4-0e706f74ed45',
      },
      categories: {
        testCategory: {
          testResourceName: {
            existingParam: 'existingParamValue',
          },
        },
      },
    },
  };
  const removedParams = {
    testEnv: {
      awscloudformation: {
        StackId:
          // eslint-disable-next-line spellcheck/spell-checker
          'arn:aws:cloudformation:us-east-1:1234567891011:stack/amplify-teamprovider-dev-134909/df33f4d0-1895-11eb-a8b4-0e706f74ed45',
      },
    },
  };

  const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
  stateManagerMock.getTeamProviderInfo.mockReturnValue(existingParams);

  removeResourceParameters((contextStub as unknown) as $TSContext, 'testCategory', 'testResourceName');

  expect(stateManagerMock.setTeamProviderInfo).toHaveBeenCalledWith(undefined, removedParams);
});
