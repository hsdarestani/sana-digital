import {defineConfig,devices} from '@playwright/test';
const webkitLaunch=process.env.SANA_WEBKIT_EXECUTABLE?{executablePath:process.env.SANA_WEBKIT_EXECUTABLE}:{};
export default defineConfig({testDir:'./tests/browser',fullyParallel:true,workers:2,timeout:60000,expect:{timeout:8000},reporter:[['list'],['json',{outputFile:'test-results/journeys.json'}]],use:{baseURL:'https://sana.test',acceptDownloads:true,screenshot:'only-on-failure',trace:'retain-on-failure',locale:'de-DE',timezoneId:'Europe/Berlin'},projects:[
 {name:'desktop-chromium',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},
 {name:'android-chromium',use:{...devices['Pixel 7']}},
 {name:'ipad-safari-landscape',use:{...devices['iPad Mini landscape'],browserName:'webkit',launchOptions:webkitLaunch}},
 {name:'ipad-safari-portrait',use:{...devices['iPad Mini'],browserName:'webkit',launchOptions:webkitLaunch}},
 {name:'iphone-safari',use:{...devices['iPhone 13'],browserName:'webkit',launchOptions:webkitLaunch}}
]});
