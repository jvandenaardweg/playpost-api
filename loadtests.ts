// tslint:disable-next-line: no-implicit-dependencies
import loadtest from 'loadtest'

// tslint:disable: no-console
const options = {
	url: 'http://localhost:3000/v1/me',
  maxRequests: 10000,
  concurrency: 25, // parallel requests
  headers: {
    // Generate API key's yourself
    // These ones won't work on your machine
    'X-Api-Key': '226421e6cfcb661c408c819334ec61643f91747a419bfd9e15f8662e1956868c',
    'X-Api-Secret': '6935eb65188a4b4c4c13e8a836004d48653543aaa890c7aeaab7c0ae73787796'
  }
};

console.log('Running loadtests with config: ')
console.log(options)

loadtest.loadTest(options, (error, result) => {
	if (error) {
		return console.error('Got an error: %s', error);
  }

  console.log('Tests run successfully!');
  console.log(result)
});
