export type Address = `0x${string}`

export type ChainKey =
  | 'local'
  | 'sepolia'
  | 'mainnet'
  | 'arbitrum'
  | 'base'
  | 'optimism'
  | 'polygon'
  | 'scroll'
  | 'linea'
  | 'unichain'
  | 'ronin'
  | 'mantle'

export type MarketKey = string

export interface TokenConfig {
  symbol: string
  address: Address
  decimals: number
  priceFeed?: Address
}

export interface MarketConfig {
  key: MarketKey
  name: string
  symbol: string
  cometAddress: Address
  baseToken: TokenConfig
  collaterals: Record<string, TokenConfig>
  defaultCollateralSymbol: string
  configuratorAddress?: Address
  rewardsAddress?: Address
  bulkerAddress?: Address
}

export interface ChainConfig {
  key: ChainKey
  name: string
  chainId: number
  explorerUrl: string
  rpcEnvVar?: string
  defaultRpcUrl: string
  isTestnet: boolean
  description: string
  defaultMarket: string
  markets: Record<string, MarketConfig>
}

export interface ActiveSelection {
  chainKey: ChainKey
  marketKey: string
  collateralSymbol: string
}

export const CHAIN_ORDER: ChainKey[] = [
  'local',
  'sepolia',
  'mainnet',
  'arbitrum',
  'base',
  'optimism',
  'polygon',
  'scroll',
  'linea',
  'unichain',
  'ronin',
  'mantle'
]

export const CHAIN_CONFIGS: Record<ChainKey, ChainConfig> = {
  local: {
    key: 'local',
    name: 'Local Mainnet Fork',
    chainId: 31337,
    explorerUrl: 'https://etherscan.io',
    defaultRpcUrl: 'http://127.0.0.1:8545',
    isTestnet: false,
    description: 'Local Hardhat node forked from Ethereum mainnet',
    defaultMarket: 'mainnet-usdc-fork',
    markets: {
      'mainnet-usdc-fork': {
        key: 'mainnet-usdc-fork',
        name: 'Compound USDC (Fork)',
        symbol: 'cUSDCv3',
        cometAddress: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
        baseToken: {
          symbol: 'USDC',
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          decimals: 6,
          priceFeed: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6'
        },
        collaterals: {
          COMP: {
            symbol: 'COMP',
            address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
            decimals: 18,
            priceFeed: '0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5'
          },
          LINK: {
            symbol: 'LINK',
            address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
            decimals: 18,
            priceFeed: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c'
          },
          UNI: {
            symbol: 'UNI',
            address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            decimals: 18,
            priceFeed: '0x553303d460EE0afB37EdFf9bE42922D8FF63220e'
          },
          WBTC: {
            symbol: 'WBTC',
            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            decimals: 8,
            priceFeed: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c'
          },
          WETH: {
            symbol: 'WETH',
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            decimals: 18,
            priceFeed: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0x316f9708bB98af7dA9c68C1C3b5e79039cD336E3',
        rewardsAddress: '0x1B0e765F6224C21223AeA2af16c1C46E38885a40',
        bulkerAddress: '0xa397a8C2086C554B531c02E29f3291c9704B00c7'
      }
    }
  },
  sepolia: {
    key: 'sepolia',
    name: 'Sepolia Testnet',
    chainId: 11155111,
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcEnvVar: 'NEXT_PUBLIC_SEPOLIA_RPC_URL',
    defaultRpcUrl: 'https://ethereum-sepolia.publicnode.com',
    isTestnet: true,
    description: 'Ethereum Sepolia testnet for testing',
    defaultMarket: 'usdc',
    markets: {
      usdc: {
        key: 'usdc',
        name: 'Compound USDC',
        symbol: 'cUSDCv3',
        cometAddress: '0xAec1F48e02Cfb822Be958B68C7957156EB3F0b6e',
        baseToken: {
          symbol: 'USDC',
          address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          decimals: 6,
          priceFeed: '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E'
        },
        collaterals: {
          COMP: {
            symbol: 'COMP',
            address: '0xA6c8D1c55951e8AC44a0EaA959Be5Fd21cc07531',
            decimals: 18,
            priceFeed: '0x619db7F74C0061E2917D1D57f834D9D24C5529dA'
          },
          WBTC: {
            symbol: 'WBTC',
            address: '0xa035b9e130F2B1AedC733eEFb1C67Ba4c503491F',
            decimals: 8,
            priceFeed: '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43'
          },
          WETH: {
            symbol: 'WETH',
            address: '0x2D5ee574e710219a521449679A4A7f2B43f046ad',
            decimals: 18,
            priceFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306'
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0xc28aD44975C614EaBe0Ed090207314549e1c6624',
        rewardsAddress: '0x8bF5b658bdF0388E8b482ED51B14aef58f90abfD',
        bulkerAddress: '0x157c001bb1F8b33743B14483Be111C961d8e11dE'
      },
      weth: {
        key: 'weth',
        name: 'Compound WETH',
        symbol: 'cWETHv3',
        cometAddress: '0x2943ac1216979aD8dB76D9147F64E61adc126e96',
        baseToken: {
          symbol: 'WETH',
          address: '0x2D5ee574e710219a521449679A4A7f2B43f046ad',
          decimals: 18
        },
        collaterals: {
          cbETH: {
            symbol: 'cbETH',
            address: '0xb9fa8F5eC3Da13B508F462243Ad0555B46E028df',
            decimals: 18,
            priceFeed: '0xBE60803049CA4Aea3B75E4238d664aEbcdDd0773'
          },
          wstETH: {
            symbol: 'wstETH',
            address: '0xB82381A3fBD3FaFA77B3a7bE693342618240067b',
            decimals: 18,
            priceFeed: '0x722c4ba7Eb8A1b0fD360bFF6cf19E5E2AA1C3DdF'
          }
        },
        defaultCollateralSymbol: 'cbETH',
        configuratorAddress: '0xc28aD44975C614EaBe0Ed090207314549e1c6624',
        rewardsAddress: '0x8bF5b658bdF0388E8b482ED51B14aef58f90abfD',
        bulkerAddress: '0xaD0C044425D81a2E223f4CE699156900fead2Aaa'
      }
    }
  },
  mainnet: {
    key: 'mainnet',
    name: 'Ethereum Mainnet',
    chainId: 1,
    explorerUrl: 'https://etherscan.io',
    rpcEnvVar: 'NEXT_PUBLIC_MAINNET_RPC_URL',
    defaultRpcUrl: 'https://ethereum.publicnode.com',
    isTestnet: false,
    description: 'Ethereum mainnet',
    defaultMarket: 'usdc',
    markets: {
      usdc: {
        key: 'usdc',
        name: 'Compound USDC',
        symbol: 'cUSDCv3',
        cometAddress: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
        baseToken: {
          symbol: 'USDC',
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          decimals: 6,
          priceFeed: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6'
        },
        collaterals: {
          COMP: {
            symbol: 'COMP',
            address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
            decimals: 18,
            priceFeed: '0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5'
          },
          LINK: {
            symbol: 'LINK',
            address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
            decimals: 18,
            priceFeed: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c'
          },
          UNI: {
            symbol: 'UNI',
            address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            decimals: 18,
            priceFeed: '0x553303d460EE0afB37EdFf9bE42922D8FF63220e'
          },
          WBTC: {
            symbol: 'WBTC',
            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            decimals: 8,
            priceFeed: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c'
          },
          WETH: {
            symbol: 'WETH',
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            decimals: 18,
            priceFeed: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0x316f9708bB98af7dA9c68C1C3b5e79039cD336E3',
        rewardsAddress: '0x1B0e765F6224C21223AeA2af16c1C46E38885a40',
        bulkerAddress: '0xa397a8C2086C554B531c02E29f3291c9704B00c7'
      },
      usds: {
        key: 'usds',
        name: 'Compound USDS',
        symbol: 'cUSDSv3',
        cometAddress: '0x5D409e56D886231aDAf00c8775665AD0f9897b56',
        baseToken: {
          symbol: 'USDS',
          address: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
          decimals: 18,
          priceFeed: '0xfF30586cD0F29eD462364C7e81375FC0C71219b1'
        },
        collaterals: {
          cbBTC: {
            symbol: 'cbBTC',
            address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
            decimals: 8,
            priceFeed: '0x2665701293fCbEB223D11A08D826563EDcCE423A'
          },
          tBTC: {
            symbol: 'tBTC',
            address: '0x18084fbA666a33d37592fA2633fD49a74DD93a88',
            decimals: 18,
            priceFeed: '0x8350b7De6a6a2C1368E7D4Bd968190e13E354297'
          },
          USDe: {
            symbol: 'USDe',
            address: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
            decimals: 18,
            priceFeed: '0xa569d910839Ae8865Da8F8e70FfFb0cBA869F961'
          },
          WETH: {
            symbol: 'WETH',
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            decimals: 18,
            priceFeed: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
          },
          wstETH: {
            symbol: 'wstETH',
            address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0x316f9708bB98af7dA9c68C1C3b5e79039cD336E3',
        rewardsAddress: '0x1B0e765F6224C21223AeA2af16c1C46E38885a40',
        bulkerAddress: '0xa397a8C2086C554B531c02E29f3291c9704B00c7'
      },
      usdt: {
        key: 'usdt',
        name: 'Compound USDT',
        symbol: 'cUSDTv3',
        cometAddress: '0x3Afdc9BCA9213A35503b077a6072F3D0d5AB0840',
        baseToken: {
          symbol: 'USDT',
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          decimals: 6,
          priceFeed: '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D'
        },
        collaterals: {
          COMP: {
            symbol: 'COMP',
            address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
            decimals: 18,
            priceFeed: '0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5'
          },
          LINK: {
            symbol: 'LINK',
            address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
            decimals: 18,
            priceFeed: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c'
          },
          UNI: {
            symbol: 'UNI',
            address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            decimals: 18,
            priceFeed: '0x553303d460EE0afB37EdFf9bE42922D8FF63220e'
          },
          WBTC: {
            symbol: 'WBTC',
            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            decimals: 8
          },
          WETH: {
            symbol: 'WETH',
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            decimals: 18,
            priceFeed: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
          },
          wstETH: {
            symbol: 'wstETH',
            address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0x316f9708bB98af7dA9c68C1C3b5e79039cD336E3',
        rewardsAddress: '0x1B0e765F6224C21223AeA2af16c1C46E38885a40',
        bulkerAddress: '0xa397a8C2086C554B531c02E29f3291c9704B00c7'
      },
      wbtc: {
        key: 'wbtc',
        name: 'Compound WBTC',
        symbol: 'cWBTCv3',
        cometAddress: '0xe85Dc543813B8c2CFEaAc371517b925a166a9293',
        baseToken: {
          symbol: 'WBTC',
          address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
          decimals: 8,
          priceFeed: '0xfdFD9C85aD200c506Cf9e21F1FD8dd01932FBB23'
        },
        collaterals: {
          LBTC: {
            symbol: 'LBTC',
            address: '0x8236a87084f8B84306f72007F36F2618A5634494',
            decimals: 8,
            priceFeed: '0x5c29868C58b6e15e2b962943278969Ab6a7D3212'
          },
          pumpBTC: {
            symbol: 'pumpBTC',
            address: '0xF469fBD2abcd6B9de8E169d128226C0Fc90a012e',
            decimals: 8
          }
        },
        defaultCollateralSymbol: 'LBTC',
        configuratorAddress: '0x316f9708bB98af7dA9c68C1C3b5e79039cD336E3',
        rewardsAddress: '0x1B0e765F6224C21223AeA2af16c1C46E38885a40',
        bulkerAddress: '0xa397a8C2086C554B531c02E29f3291c9704B00c7'
      },
      weth: {
        key: 'weth',
        name: 'Compound WETH',
        symbol: 'cWETHv3',
        cometAddress: '0xA17581A9E3356d9A858b789D68B4d866e593aE94',
        baseToken: {
          symbol: 'WETH',
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          decimals: 18
        },
        collaterals: {
          cbETH: {
            symbol: 'cbETH',
            address: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704',
            decimals: 18
          },
          wstETH: {
            symbol: 'wstETH',
            address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'cbETH',
        configuratorAddress: '0x316f9708bB98af7dA9c68C1C3b5e79039cD336E3',
        rewardsAddress: '0x1B0e765F6224C21223AeA2af16c1C46E38885a40',
        bulkerAddress: '0xa397a8C2086C554B531c02E29f3291c9704B00c7'
      },
      wsteth: {
        key: 'wsteth',
        name: 'Compound wstETH',
        symbol: 'cWstETHv3',
        cometAddress: '0x3D0bb1ccaB520A66e607822fC55BC921738fAFE3',
        baseToken: {
          symbol: 'wstETH',
          address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
          decimals: 18
        },
        collaterals: {
          ezETH: {
            symbol: 'ezETH',
            address: '0xbf5495Efe5DB9ce00f80364C8B423567e58d2110',
            decimals: 18
          },
          rsETH: {
            symbol: 'rsETH',
            address: '0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'rsETH',
        configuratorAddress: '0x316f9708bB98af7dA9c68C1C3b5e79039cD336E3',
        rewardsAddress: '0x1B0e765F6224C21223AeA2af16c1C46E38885a40',
        bulkerAddress: '0x2c776041CCFe903071AF44aa147368a9c8EEA518'
      }
    }
  },
  arbitrum: {
    key: 'arbitrum',
    name: 'Arbitrum One',
    chainId: 42161,
    explorerUrl: 'https://arbiscan.io',
    rpcEnvVar: 'NEXT_PUBLIC_ARBITRUM_RPC_URL',
    defaultRpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
    isTestnet: false,
    description: 'Arbitrum mainnet',
    defaultMarket: 'usdc',
    markets: {
      usdc: {
        key: 'usdc',
        name: 'Compound USDC',
        symbol: 'cUSDCv3',
        cometAddress: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
        baseToken: {
          symbol: 'USDC',
          address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          decimals: 6,
          priceFeed: '0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3'
        },
        collaterals: {
          ARB: {
            symbol: 'ARB',
            address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
            decimals: 18,
            priceFeed: '0xb2A824043730FE05F3DA2efaFa1CBbe83fa548D6'
          },
          GMX: {
            symbol: 'GMX',
            address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
            decimals: 18,
            priceFeed: '0xDB98056FecFff59D032aB628337A4887110df3dB'
          },
          WBTC: {
            symbol: 'WBTC',
            address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
            decimals: 8,
            priceFeed: '0xd0C7101eACbB49F3deCcCc166d238410D6D46d57'
          },
          WETH: {
            symbol: 'WETH',
            address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            decimals: 18,
            priceFeed: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612'
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0xb21b06D71c75973babdE35b49fFDAc3F82Ad3775',
        rewardsAddress: '0x88730d254A2f7e6AC8388c3198aFd694bA9f7fae',
        bulkerAddress: '0xbdE8F31D2DdDA895264e27DD990faB3DC87b372d'
      },
      'usdc.e': {
        key: 'usdc.e',
        name: 'Compound USDC',
        symbol: 'cUSDCv3',
        cometAddress: '0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA',
        baseToken: {
          symbol: 'USDC.e',
          address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
          decimals: 6,
          priceFeed: '0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3'
        },
        collaterals: {
          ARB: {
            symbol: 'ARB',
            address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
            decimals: 18,
            priceFeed: '0xb2A824043730FE05F3DA2efaFa1CBbe83fa548D6'
          },
          GMX: {
            symbol: 'GMX',
            address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
            decimals: 18,
            priceFeed: '0xDB98056FecFff59D032aB628337A4887110df3dB'
          },
          WBTC: {
            symbol: 'WBTC',
            address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
            decimals: 8,
            priceFeed: '0xd0C7101eACbB49F3deCcCc166d238410D6D46d57'
          },
          WETH: {
            symbol: 'WETH',
            address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            decimals: 18,
            priceFeed: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612'
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0xb21b06D71c75973babdE35b49fFDAc3F82Ad3775',
        rewardsAddress: '0x88730d254A2f7e6AC8388c3198aFd694bA9f7fae',
        bulkerAddress: '0xbdE8F31D2DdDA895264e27DD990faB3DC87b372d'
      },
      usdt: {
        key: 'usdt',
        name: 'Compound USDT',
        symbol: 'cUSDTv3',
        cometAddress: '0xd98Be00b5D27fc98112BdE293e487f8D4cA57d07',
        baseToken: {
          symbol: 'USDT',
          address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
          decimals: 6,
          priceFeed: '0x3f3f5dF88dC9F13eac63DF89EC16ef6e7E25DdE7'
        },
        collaterals: {
          ARB: {
            symbol: 'ARB',
            address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
            decimals: 18,
            priceFeed: '0xb2A824043730FE05F3DA2efaFa1CBbe83fa548D6'
          },
          GMX: {
            symbol: 'GMX',
            address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
            decimals: 18,
            priceFeed: '0xDB98056FecFff59D032aB628337A4887110df3dB'
          },
          WBTC: {
            symbol: 'WBTC',
            address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
            decimals: 8,
            priceFeed: '0xd0C7101eACbB49F3deCcCc166d238410D6D46d57'
          },
          WETH: {
            symbol: 'WETH',
            address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            decimals: 18,
            priceFeed: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612'
          },
          wstETH: {
            symbol: 'wstETH',
            address: '0x5979D7b546E38E414F7E9822514be443A4800529',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0xb21b06D71c75973babdE35b49fFDAc3F82Ad3775',
        rewardsAddress: '0x88730d254A2f7e6AC8388c3198aFd694bA9f7fae',
        bulkerAddress: '0xbdE8F31D2DdDA895264e27DD990faB3DC87b372d'
      },
      weth: {
        key: 'weth',
        name: 'Compound WETH',
        symbol: 'cWETHv3',
        cometAddress: '0x6f7D514bbD4aFf3BcD1140B7344b32f063dEe486',
        baseToken: {
          symbol: 'WETH',
          address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
          decimals: 18
        },
        collaterals: {
          rETH: {
            symbol: 'rETH',
            address: '0xEC70Dcb4A1EFa46b8F2D97C310C9c4790ba5ffA8',
            decimals: 18
          },
          weETH: {
            symbol: 'weETH',
            address: '0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe',
            decimals: 18
          },
          wstETH: {
            symbol: 'wstETH',
            address: '0x5979D7b546E38E414F7E9822514be443A4800529',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'weETH',
        configuratorAddress: '0xb21b06D71c75973babdE35b49fFDAc3F82Ad3775',
        rewardsAddress: '0x88730d254A2f7e6AC8388c3198aFd694bA9f7fae',
        bulkerAddress: '0xbdE8F31D2DdDA895264e27DD990faB3DC87b372d'
      }
    }
  },
  base: {
    key: 'base',
    name: 'Base',
    chainId: 8453,
    explorerUrl: 'https://basescan.org',
    rpcEnvVar: 'NEXT_PUBLIC_BASE_RPC_URL',
    defaultRpcUrl: 'https://base-rpc.publicnode.com',
    isTestnet: false,
    description: 'Base mainnet',
    defaultMarket: 'usdc',
    markets: {
      aero: {
        key: 'aero',
        name: 'Compound AERO',
        symbol: 'cAEROv3',
        cometAddress: '0x784efeB622244d2348d4F2522f8860B96fbEcE89',
        baseToken: {
          symbol: 'AERO',
          address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
          decimals: 18
        },
        collaterals: {
          cbBTC: {
            symbol: 'cbBTC',
            address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
            decimals: 8
          },
          USDC: {
            symbol: 'USDC',
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            decimals: 6
          },
          WETH: {
            symbol: 'WETH',
            address: '0x4200000000000000000000000000000000000006',
            decimals: 18
          },
          wstETH: {
            symbol: 'wstETH',
            address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0x45939657d1CA34A8FA39A924B71D28Fe8431e581',
        rewardsAddress: '0x123964802e6ABabBE1Bc9547D72Ef1B69B00A6b1',
        bulkerAddress: '0x78D0677032A35c63D142a48A2037048871212a8C'
      },
      usdbc: {
        key: 'usdbc',
        name: 'Compound USDbC',
        symbol: 'cUSDbCv3',
        cometAddress: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
        baseToken: {
          symbol: 'USDbC',
          address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
          decimals: 6,
          priceFeed: '0x7e860098F58bBFC8648a4311b374B1D669a2bc6B'
        },
        collaterals: {
          cbETH: {
            symbol: 'cbETH',
            address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
            decimals: 18
          },
          WETH: {
            symbol: 'WETH',
            address: '0x4200000000000000000000000000000000000006',
            decimals: 18,
            priceFeed: '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70'
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0x45939657d1CA34A8FA39A924B71D28Fe8431e581',
        rewardsAddress: '0x123964802e6ABabBE1Bc9547D72Ef1B69B00A6b1',
        bulkerAddress: '0x78D0677032A35c63D142a48A2037048871212a8C'
      },
      usdc: {
        key: 'usdc',
        name: 'Compound USDC',
        symbol: 'cUSDCv3',
        cometAddress: '0xb125E6687d4313864e53df431d5425969c15Eb2F',
        baseToken: {
          symbol: 'USDC',
          address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          decimals: 6,
          priceFeed: '0x7e860098F58bBFC8648a4311b374B1D669a2bc6B'
        },
        collaterals: {
          cbETH: {
            symbol: 'cbETH',
            address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
            decimals: 18,
            priceFeed: '0x4687670f5f01716fAA382E2356C103BaD776752C'
          },
          WETH: {
            symbol: 'WETH',
            address: '0x4200000000000000000000000000000000000006',
            decimals: 18,
            priceFeed: '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70'
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0x45939657d1CA34A8FA39A924B71D28Fe8431e581',
        rewardsAddress: '0x123964802e6ABabBE1Bc9547D72Ef1B69B00A6b1',
        bulkerAddress: '0x78D0677032A35c63D142a48A2037048871212a8C'
      },
      usds: {
        key: 'usds',
        name: 'Compound USDS',
        symbol: 'cUSDSv3',
        cometAddress: '0x2c776041CCFe903071AF44aa147368a9c8EEA518',
        baseToken: {
          symbol: 'USDS',
          address: '0x820C137fa70C8691f0e44Dc420a5e53c168921Dc',
          decimals: 18,
          priceFeed: '0x2330aaE3bca5F05169d5f4597964D44522F62930'
        },
        collaterals: {
          cbBTC: {
            symbol: 'cbBTC',
            address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
            decimals: 8,
            priceFeed: '0x07DA0E54543a844a80ABE69c8A12F22B3aA59f9D'
          },
          sUSDS: {
            symbol: 'sUSDS',
            address: '0x5875eEE11Cf8398102FdAd704C9E96607675467a',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'sUSDS',
        configuratorAddress: '0x45939657d1CA34A8FA39A924B71D28Fe8431e581',
        rewardsAddress: '0x123964802e6ABabBE1Bc9547D72Ef1B69B00A6b1',
        bulkerAddress: '0x78D0677032A35c63D142a48A2037048871212a8C'
      },
      weth: {
        key: 'weth',
        name: 'Compound WETH',
        symbol: 'cWETHv3',
        cometAddress: '0x46e6b214b524310239732D51387075E0e70970bf',
        baseToken: {
          symbol: 'WETH',
          address: '0x4200000000000000000000000000000000000006',
          decimals: 18
        },
        collaterals: {
          cbETH: {
            symbol: 'cbETH',
            address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'cbETH',
        configuratorAddress: '0x45939657d1CA34A8FA39A924B71D28Fe8431e581',
        rewardsAddress: '0x123964802e6ABabBE1Bc9547D72Ef1B69B00A6b1',
        bulkerAddress: '0x78D0677032A35c63D142a48A2037048871212a8C'
      }
    }
  },
  optimism: {
    key: 'optimism',
    name: 'Optimism',
    chainId: 10,
    explorerUrl: 'https://optimistic.etherscan.io',
    rpcEnvVar: 'NEXT_PUBLIC_OPTIMISM_RPC_URL',
    defaultRpcUrl: 'https://optimism-rpc.publicnode.com',
    isTestnet: false,
    description: 'Optimism mainnet',
    defaultMarket: 'usdc',
    markets: {
      usdc: {
        key: 'usdc',
        name: 'Compound USDC',
        symbol: 'cUSDCv3',
        cometAddress: '0x2e44e174f7D53F0212823acC11C01A11d58c5bCB',
        baseToken: {
          symbol: 'USDC',
          address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          decimals: 6,
          priceFeed: '0x16a9FA2FDa030272Ce99B29CF780dFA30361E0f3'
        },
        collaterals: {
          OP: {
            symbol: 'OP',
            address: '0x4200000000000000000000000000000000000042',
            decimals: 18,
            priceFeed: '0x0D276FC14719f9292D5C1eA2198673d1f4269246'
          },
          WBTC: {
            symbol: 'WBTC',
            address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
            decimals: 8,
            priceFeed: '0x718A5788b89454aAE3A028AE9c111A29Be6c2a6F'
          },
          WETH: {
            symbol: 'WETH',
            address: '0x4200000000000000000000000000000000000006',
            decimals: 18,
            priceFeed: '0x13e3Ee699D1909E989722E753853AE30b17e08c5'
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0x84E93EC6170ED630f5ebD89A1AAE72d4F63f2713',
        rewardsAddress: '0x443EA0340cb75a160F31A440722dec7b5bc3C2E9',
        bulkerAddress: '0xcb3643CC8294B23171272845473dEc49739d4Ba3'
      },
      usdt: {
        key: 'usdt',
        name: 'Compound USDT',
        symbol: 'cUSDTv3',
        cometAddress: '0x995E394b8B2437aC8Ce61Ee0bC610D617962B214',
        baseToken: {
          symbol: 'USDT',
          address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
          decimals: 6,
          priceFeed: '0xECef79E109e997bCA29c1c0897ec9d7b03647F5E'
        },
        collaterals: {
          OP: {
            symbol: 'OP',
            address: '0x4200000000000000000000000000000000000042',
            decimals: 18,
            priceFeed: '0x0D276FC14719f9292D5C1eA2198673d1f4269246'
          },
          WBTC: {
            symbol: 'WBTC',
            address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
            decimals: 8,
            priceFeed: '0x718A5788b89454aAE3A028AE9c111A29Be6c2a6F'
          },
          WETH: {
            symbol: 'WETH',
            address: '0x4200000000000000000000000000000000000006',
            decimals: 18,
            priceFeed: '0x13e3Ee699D1909E989722E753853AE30b17e08c5'
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0x84E93EC6170ED630f5ebD89A1AAE72d4F63f2713',
        rewardsAddress: '0x443EA0340cb75a160F31A440722dec7b5bc3C2E9',
        bulkerAddress: '0xcb3643CC8294B23171272845473dEc49739d4Ba3'
      },
      weth: {
        key: 'weth',
        name: 'Compound WETH',
        symbol: 'cWETHv3',
        cometAddress: '0xE36A30D249f7761327fd973001A32010b521b6Fd',
        baseToken: {
          symbol: 'WETH',
          address: '0x4200000000000000000000000000000000000006',
          decimals: 18
        },
        collaterals: {
          rETH: {
            symbol: 'rETH',
            address: '0x9Bcef72be871e61ED4fBbc7630889beE758eb81D',
            decimals: 18
          },
          WBTC: {
            symbol: 'WBTC',
            address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
            decimals: 8
          },
          wstETH: {
            symbol: 'wstETH',
            address: '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'wstETH',
        configuratorAddress: '0x84E93EC6170ED630f5ebD89A1AAE72d4F63f2713',
        rewardsAddress: '0x443EA0340cb75a160F31A440722dec7b5bc3C2E9',
        bulkerAddress: '0xcb3643CC8294B23171272845473dEc49739d4Ba3'
      }
    }
  },
  polygon: {
    key: 'polygon',
    name: 'Polygon',
    chainId: 137,
    explorerUrl: 'https://polygonscan.com',
    rpcEnvVar: 'NEXT_PUBLIC_POLYGON_RPC_URL',
    defaultRpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    isTestnet: false,
    description: 'Polygon mainnet',
    defaultMarket: 'usdc',
    markets: {
      usdc: {
        key: 'usdc',
        name: 'Compound USDC',
        symbol: 'cUSDCv3',
        cometAddress: '0xF25212E676D1F7F89Cd72fFEe66158f541246445',
        baseToken: {
          symbol: 'USDC',
          address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
          decimals: 6,
          priceFeed: '0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7'
        },
        collaterals: {
          WBTC: {
            symbol: 'WBTC',
            address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
            decimals: 8,
            priceFeed: '0xDE31F8bFBD8c84b5360CFACCa3539B938dd78ae6'
          },
          WETH: {
            symbol: 'WETH',
            address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
            decimals: 18,
            priceFeed: '0xF9680D99D6C9589e2a93a78A04A279e509205945'
          },
          WMATIC: {
            symbol: 'WMATIC',
            address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
            decimals: 18,
            priceFeed: '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0x83E0F742cAcBE66349E3701B171eE2487a26e738',
        rewardsAddress: '0x45939657d1CA34A8FA39A924B71D28Fe8431e581',
        bulkerAddress: '0x59e242D352ae13166B4987aE5c990C232f7f7CD6'
      },
      usdt: {
        key: 'usdt',
        name: 'Compound USDT',
        symbol: 'cUSDTv3',
        cometAddress: '0xaeB318360f27748Acb200CE616E389A6C9409a07',
        baseToken: {
          symbol: 'USDT',
          address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          decimals: 6,
          priceFeed: '0x0A6513e40db6EB1b165753AD52E80663aeA50545'
        },
        collaterals: {
          MaticX: {
            symbol: 'MaticX',
            address: '0xfa68FB4628DFF1028CFEc22b4162FCcd0d45efb6',
            decimals: 18,
            priceFeed: '0x5d37E4b374E6907de8Fc7fb33EE3b0af403C7403'
          },
          stMATIC: {
            symbol: 'stMATIC',
            address: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
            decimals: 18,
            priceFeed: '0x97371dF4492605486e23Da797fA68e55Fc38a13f'
          },
          WBTC: {
            symbol: 'WBTC',
            address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
            decimals: 8,
            priceFeed: '0xDE31F8bFBD8c84b5360CFACCa3539B938dd78ae6'
          },
          WETH: {
            symbol: 'WETH',
            address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
            decimals: 18,
            priceFeed: '0xF9680D99D6C9589e2a93a78A04A279e509205945'
          },
          WMATIC: {
            symbol: 'WMATIC',
            address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
            decimals: 18,
            priceFeed: '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0x83E0F742cAcBE66349E3701B171eE2487a26e738',
        rewardsAddress: '0x45939657d1CA34A8FA39A924B71D28Fe8431e581',
        bulkerAddress: '0x59e242D352ae13166B4987aE5c990C232f7f7CD6'
      }
    }
  },
  scroll: {
    key: 'scroll',
    name: 'Scroll',
    chainId: 534352,
    explorerUrl: 'https://scrollscan.com',
    rpcEnvVar: 'NEXT_PUBLIC_SCROLL_RPC_URL',
    defaultRpcUrl: 'https://rpc.scroll.io',
    isTestnet: false,
    description: 'Scroll mainnet',
    defaultMarket: 'usdc',
    markets: {
      usdc: {
        key: 'usdc',
        name: 'Compound USDC',
        symbol: 'cUSDCv3',
        cometAddress: '0xB2f97c1Bd3bf02f5e74d13f02E3e26F93D77CE44',
        baseToken: {
          symbol: 'USDC',
          address: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
          decimals: 6,
          priceFeed: '0x43d12Fb3AfCAd5347fA764EeAB105478337b7200'
        },
        collaterals: {
          WETH: {
            symbol: 'WETH',
            address: '0x5300000000000000000000000000000000000004',
            decimals: 18,
            priceFeed: '0x6bF14CB0A831078629D993FDeBcB182b21A8774C'
          },
          wstETH: {
            symbol: 'wstETH',
            address: '0xf610A9dfB7C89644979b4A0f27063E9e7d7Cda32',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0xECAB0bEEa3e5DEa0c35d3E69468EAC20098032D7',
        rewardsAddress: '0x70167D30964cbFDc315ECAe02441Af747bE0c5Ee',
        bulkerAddress: '0x53C6D04e3EC7031105bAeA05B36cBc3C987C56fA'
      }
    }
  },
  linea: {
    key: 'linea',
    name: 'Linea',
    chainId: 59144,
    explorerUrl: 'https://lineascan.build',
    rpcEnvVar: 'NEXT_PUBLIC_LINEA_RPC_URL',
    defaultRpcUrl: 'https://rpc.linea.build',
    isTestnet: false,
    description: 'Linea mainnet',
    defaultMarket: 'usdc',
    markets: {
      usdc: {
        key: 'usdc',
        name: 'Compound USDC',
        symbol: 'cUSDCv3',
        cometAddress: '0x8D38A3d6B3c3B7d96D6536DA7Eef94A9d7dbC991',
        baseToken: {
          symbol: 'USDC',
          address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
          decimals: 6,
          priceFeed: '0xAADAa473C1bDF7317ec07c915680Af29DeBfdCb5'
        },
        collaterals: {
          WBTC: {
            symbol: 'WBTC',
            address: '0x3aAB2285ddcDdaD8edf438C1bAB47e1a9D05a9b4',
            decimals: 8,
            priceFeed: '0x7A99092816C8BD5ec8ba229e3a6E6Da1E628E1F9'
          },
          WETH: {
            symbol: 'WETH',
            address: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
            decimals: 18,
            priceFeed: '0x3c6Cd9Cc7c7a4c2Cf5a82734CD249D7D593354dA'
          },
          wstETH: {
            symbol: 'wstETH',
            address: '0xB5beDd42000b71FddE22D3eE8a79Bd49A568fC8F',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0x970FfD8E335B8fa4cd5c869c7caC3a90671d5Dc3',
        rewardsAddress: '0x2c7118c4C88B9841FCF839074c26Ae8f035f2921',
        bulkerAddress: '0x023ee795361B28cDbB94e302983578486A0A5f1B'
      },
      weth: {
        key: 'weth',
        name: 'Compound WETH',
        symbol: 'cWETHv3',
        cometAddress: '0x60F2058379716A64a7A5d29219397e79bC552194',
        baseToken: {
          symbol: 'WETH',
          address: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
          decimals: 18
        },
        collaterals: {
          ezETH: {
            symbol: 'ezETH',
            address: '0x2416092f143378750bb29b79eD961ab195CcEea5',
            decimals: 18
          },
          WBTC: {
            symbol: 'WBTC',
            address: '0x3aAB2285ddcDdaD8edf438C1bAB47e1a9D05a9b4',
            decimals: 8
          },
          weETH: {
            symbol: 'weETH',
            address: '0x1Bf74C010E6320bab11e2e5A532b5AC15e0b8aA6',
            decimals: 18
          },
          wrsETH: {
            symbol: 'wrsETH',
            address: '0xD2671165570f41BBB3B0097893300b6EB6101E6C',
            decimals: 18
          },
          wstETH: {
            symbol: 'wstETH',
            address: '0xB5beDd42000b71FddE22D3eE8a79Bd49A568fC8F',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'ezETH',
        configuratorAddress: '0x970FfD8E335B8fa4cd5c869c7caC3a90671d5Dc3',
        rewardsAddress: '0x2c7118c4C88B9841FCF839074c26Ae8f035f2921',
        bulkerAddress: '0x023ee795361B28cDbB94e302983578486A0A5f1B'
      }
    }
  },
  unichain: {
    key: 'unichain',
    name: 'Unichain',
    chainId: 130,
    explorerUrl: 'https://unichain.blockscout.com',
    rpcEnvVar: 'NEXT_PUBLIC_UNICHAIN_RPC_URL',
    defaultRpcUrl: 'https://mainnet.unichain.org',
    isTestnet: false,
    description: 'Unichain mainnet',
    defaultMarket: 'usdc',
    markets: {
      usdc: {
        key: 'usdc',
        name: 'Compound USDC',
        symbol: 'cUSDCv3',
        cometAddress: '0x2c7118c4C88B9841FCF839074c26Ae8f035f2921',
        baseToken: {
          symbol: 'USDC',
          address: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
          decimals: 6
        },
        collaterals: {
          UNI: {
            symbol: 'UNI',
            address: '0x8f187aA05619a017077f5308904739877ce9eA21',
            decimals: 18
          },
          WETH: {
            symbol: 'WETH',
            address: '0x4200000000000000000000000000000000000006',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0x8df378453Ff9dEFFa513367CDF9b3B53726303e9',
        rewardsAddress: '0x6f7D514bbD4aFf3BcD1140B7344b32f063dEe486',
        bulkerAddress: '0x58EbB8Db8b4FdF2dCbbB16E04c2F5b952963B514'
      },
      weth: {
        key: 'weth',
        name: 'Compound WETH',
        symbol: 'cWETHv3',
        cometAddress: '0x6C987dDE50dB1dcDd32Cd4175778C2a291978E2a',
        baseToken: {
          symbol: 'WETH',
          address: '0x4200000000000000000000000000000000000006',
          decimals: 18
        },
        collaterals: {
          ezETH: {
            symbol: 'ezETH',
            address: '0x2416092f143378750bb29b79eD961ab195CcEea5',
            decimals: 18
          },
          UNI: {
            symbol: 'UNI',
            address: '0x8f187aA05619a017077f5308904739877ce9eA21',
            decimals: 18
          },
          WBTC: {
            symbol: 'WBTC',
            address: '0x927B51f251480a681271180DA4de28D44EC4AfB8',
            decimals: 8
          },
          weETH: {
            symbol: 'weETH',
            address: '0x7DCC39B4d1C53CB31e1aBc0e358b43987FEF80f7',
            decimals: 18
          },
          wstETH: {
            symbol: 'wstETH',
            address: '0xc02fE7317D4eb8753a02c35fe019786854A92001',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'wstETH',
        configuratorAddress: '0x8df378453Ff9dEFFa513367CDF9b3B53726303e9',
        rewardsAddress: '0x6f7D514bbD4aFf3BcD1140B7344b32f063dEe486',
        bulkerAddress: '0x58EbB8Db8b4FdF2dCbbB16E04c2F5b952963B514'
      }
    }
  },
  ronin: {
    key: 'ronin',
    name: 'Ronin',
    chainId: 2020,
    explorerUrl: 'https://app.roninchain.com',
    rpcEnvVar: 'NEXT_PUBLIC_RONIN_RPC_URL',
    defaultRpcUrl: 'https://api.roninchain.com/rpc',
    isTestnet: false,
    description: 'Ronin mainnet',
    defaultMarket: 'wron',
    markets: {
      weth: {
        key: 'weth',
        name: 'Compound WETH',
        symbol: 'cWETHv3',
        cometAddress: '0x4006eD4097Ee51c09A04c3B0951D28CCf19e6DFE',
        baseToken: {
          symbol: 'WETH',
          address: '0xc99a6A985eD2Cac1ef41640596C5A5f9F4E19Ef5',
          decimals: 18,
          priceFeed: '0x8AC2b57d15c84755A3333aD68025d2496AE3BeBD'
        },
        collaterals: {
          AXS: {
            symbol: 'AXS',
            address: '0x97a9107C1793BC407d6F527b77e7fff4D812bece',
            decimals: 18,
            priceFeed: '0xB2237b8F0690f7F8c7D03FE70da62213714F8B5D'
          },
          USDC: {
            symbol: 'USDC',
            address: '0x0B7007c13325C48911F73A2daD5FA5dCBf808aDc',
            decimals: 6,
            priceFeed: '0xC41CdfAE648A76EF471160F62bf38a03Ad5B67DF'
          },
          WRON: {
            symbol: 'WRON',
            address: '0xe514d9DEB7966c8BE0ca922de8a064264eA6bcd4',
            decimals: 18,
            priceFeed: '0x692e4736f891CD940bA559d487845117e2c6b48D'
          }
        },
        defaultCollateralSymbol: 'WRON',
        configuratorAddress: '0x966c72F456FC248D458784EF3E0b6d042be115F2',
        rewardsAddress: '0x31CdEe8609Bc15fD33cc525f101B70a81b2B1E59',
        bulkerAddress: '0x840281FaD56DD88afba052B7F18Be2A65796Ecc6'
      },
      wron: {
        key: 'wron',
        name: 'Compound WRON',
        symbol: 'cWRONv3',
        cometAddress: '0xc0Afdbd1cEB621Ef576BA969ce9D4ceF78Dbc0c0',
        baseToken: {
          symbol: 'WRON',
          address: '0xe514d9DEB7966c8BE0ca922de8a064264eA6bcd4',
          decimals: 18,
          priceFeed: '0x0B6074F21488B95945989E513EFEA070096d931D'
        },
        collaterals: {
          AXS: {
            symbol: 'AXS',
            address: '0x97a9107C1793BC407d6F527b77e7fff4D812bece',
            decimals: 18,
            priceFeed: '0x81DfC7A054C8F60497e47579c5A5cEB37bc047e8'
          },
          USDC: {
            symbol: 'USDC',
            address: '0x0B7007c13325C48911F73A2daD5FA5dCBf808aDc',
            decimals: 6,
            priceFeed: '0x88f415c12d45d4C6DC018553BBE472A4558ff3f8'
          },
          WETH: {
            symbol: 'WETH',
            address: '0xc99a6A985eD2Cac1ef41640596C5A5f9F4E19Ef5',
            decimals: 18,
            priceFeed: '0x662Fdb0E7D95d89CD3458E4A3506296E48BB1F44'
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0x966c72F456FC248D458784EF3E0b6d042be115F2',
        rewardsAddress: '0x31CdEe8609Bc15fD33cc525f101B70a81b2B1E59',
        bulkerAddress: '0x840281FaD56DD88afba052B7F18Be2A65796Ecc6'
      }
    }
  },
  mantle: {
    key: 'mantle',
    name: 'Mantle',
    chainId: 5000,
    explorerUrl: 'https://explorer.mantle.xyz',
    rpcEnvVar: 'NEXT_PUBLIC_MANTLE_RPC_URL',
    defaultRpcUrl: 'https://rpc.mantle.xyz',
    isTestnet: false,
    description: 'Mantle mainnet',
    defaultMarket: 'usde',
    markets: {
      usde: {
        key: 'usde',
        name: 'Compound USDe',
        symbol: 'cUSDev3',
        cometAddress: '0x606174f62cd968d8e684c645080fa694c1D7786E',
        baseToken: {
          symbol: 'USDe',
          address: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
          decimals: 18
        },
        collaterals: {
          FBTC: {
            symbol: 'FBTC',
            address: '0xC96dE26018A54D51c097160568752c4E3BD6C364',
            decimals: 8
          },
          mETH: {
            symbol: 'mETH',
            address: '0xcDA86A272531e8640cD7F1a92c01839911B90bb0',
            decimals: 18
          },
          WETH: {
            symbol: 'WETH',
            address: '0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111',
            decimals: 18
          }
        },
        defaultCollateralSymbol: 'WETH',
        configuratorAddress: '0xb77Cd4cD000957283D8BAf53cD782ECf029cF7DB',
        rewardsAddress: '0xCd83CbBFCE149d141A5171C3D6a0F0fCCeE225Ab',
        bulkerAddress: '0x67DFCa85CcEEFA2C5B1dB4DEe3BEa716A28B9baa'
      }
    }
  }
}

export function isValidChainKey(chainKey: string): chainKey is ChainKey {
  return chainKey in CHAIN_CONFIGS
}

export function getChainConfig(chainKey: ChainKey): ChainConfig {
  return CHAIN_CONFIGS[chainKey]
}

export function getMarketsForChain(chainKey: ChainKey): Record<string, MarketConfig> {
  return CHAIN_CONFIGS[chainKey].markets
}

export function getMarketConfig(chainKey: ChainKey, marketKey?: string): MarketConfig {
  const chain = CHAIN_CONFIGS[chainKey]
  const resolvedMarketKey = marketKey && marketKey in chain.markets ? marketKey : chain.defaultMarket
  return chain.markets[resolvedMarketKey]
}

export function getAllChainConfigs(): ChainConfig[] {
  return CHAIN_ORDER.map((chainKey) => CHAIN_CONFIGS[chainKey])
}
