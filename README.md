# Tutorial II Apify SDK

## Quiz

### Where and how can you use jQuery with the SDK?
  - Inside the `handlePageFunction` mainly for data extraction from the HTML representing the scraped pages. We can use jQuery to obtain an element identified by a certain selector and save its value (text value typically).
  - It can be used along with the `CheerioCrawler` which provides `$` property inside an object argument of `handlePageFunction`.
### What is the main difference between Cheerio and jQuery?
  - Cheerio implements jQuery for server-side use (in Node.js). It provides jQuery API for manipulating DOM of HTML outside the browser context.
  - Pure jQuery runs in a browser and it operates with the browser's DOM directly. 
### When would you use CheerioCrawler and what are its limitations?
  - `CheerioCrawler` is easy to use and very fast when it comes to scraping high rate of pages per minute. It is also cheap in terms of computing power.
  - On the other hand, it can not deal with most of the modern websites as they use JavaScript to create the final HTML. `CheerioCrawler` uses plain HTTP requests to get HTML pages corresponding to the provided URLs. Designed in this way, it scrapes the pages as they load before any JavaScript code is executed.
### What are the main classes for managing requests and when and why would you use one instead of another?
  - The requests themselves are represented by the `Request` class. It requires URL in the constructor and one can optionally add metadata such as HTTP method, headers, or payload as well.
  - We'll make use of `RequestList` and `RequestQueue` classes to specify URLs that are to be crawled.
    - `RequestList` represents a static list of URLs that can be defined directly in the code or they can be loaded from the text file. It comes in handy when we have a limited set of URLs we need to crawl and we are able to specify them statically.
    - `RequestQueue`, on the flip side, offers dynamic collection of URLs which can be modified during runtime. In the typical use-case scenario of the `RequestQueue` we provide one or more links manually in the script and then enqueue new links as we scrape the website. We usually filter the links pointing to the pages on the same domain. However, links can't sometimes get collected dynamically, especially when we are using `CheerioCrawler` which doesn't execute JavaScript. Such situation leads us back to the static `RequestList`.
    - `RequestList` and `RequestQueue` instances can even be used at once if needed.
### How can you extract data from a page in Puppeteer without using jQuery?
  - Puppeteer is designed to access website pages inside of a browser. It creates an instance of a lightweight browser by calling `await puppeteer.launch()`. One can use this `Browser` instance to browse different pages and interact with them using the Puppeteer's API which doesn't depend on jQuery. A single tab in the browser is represented by the instance of a `Page` class which provides a rich collection of methods for tab's manipulation.
### What is the default concurrency/parallelism the SDK uses?
  - It uses asynchronous functions to perform most of the tasks that are expected to run for some non-trivial time. When an async function is invoked, the script doesn't block so that it could continue and possibly call other async functions. Multiple async functions can run in parallel and their results can be accessed using the await statement.

# Tutorial III Apify Actors & Webhooks

## Quiz

### How do you allocate more CPU for your actor run?
  - By assigning higher memory capacity. Allocating 4096 MB of actor's memory results in usage of 1 CPU core. By changing the memory capacity a proportional amount of CPU power is set (2 GB correspond to the 50 % of the CPU core and so on). 
### How can you get the exact time when the actor was started from within the running actor process?
  - Using the `APIFY_STARTED_AT` environment variable from the actor's process. It can be accessed from Node.js using the `process.env` object as follows: `process.env.APIFY_STARTED_AT`.
### Which are the default storages an actor run is allocated (connected to)?
  - The actors run in Docker containers so they use local storage inside these containers during their run. Apart from that, an actor run is connected to `apify_storage` containing generated datasets and `key_value_stores` with `INPUT` and `OUTPUT` json files. Running actor's state is persisted as well in case an error occurred and the actor would need to continue from the point where it stopped running. 
### Can you change the memory allocated to a running actor?
### How can you run an actor with Puppeteer in a headful (non-headless) mode?
### Imagine the server/instance the container is running on has a 32 GB, 8-core CPU. What would be the most performant (speed/cost) memory allocation for CheerioCrawler? (Hint: NodeJS processes cannot use user-created threads)
  - 4 GB memory and the corresponding 1 CPU core as `CheerioCrawler` running in Node.js can not use more than 1 thread. Thus setup with more CPU cores would not increase crawler's speed.
