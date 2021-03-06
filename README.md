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
  - An actor can optimize their memory usage during the run through `APIFY_MEMORY_MBYTES` environment variable.
### How can you run an actor with Puppeteer in a headful (non-headless) mode?
  - By setting the value of `launchContext.launchOptions.headless` to `false` when calling the `PuppeteerCrawler` constructor. The value can be obtained using `APIFY_HEADLESS` environment variable - if this variable is set to 1, the headless mode is activated.
### Imagine the server/instance the container is running on has a 32 GB, 8-core CPU. What would be the most performant (speed/cost) memory allocation for CheerioCrawler? (Hint: NodeJS processes cannot use user-created threads)
  - 4 GB memory and the corresponding 1 CPU core as `CheerioCrawler` running in Node.js can not use more than 1 thread. Thus setup with more CPU cores would not increase crawler's speed.

# Tutorial IV Apify CLI & Source Code

## Quiz

### Do you have to rebuild an actor each time the source code is changed?
  - On the Apify platform, it is needed to rebuild an actor to propagate changes of the source code. When running an actor, the last successful build of Docker image is used. If I make changes to the source code on Apify platform I receive the following message: *To apply your changes, you need to build the actor.*
  - However, when I modify code locally and then run `apify run -p`, the actor is run by executing `npm start`. No Docker image is built in this case and the actor is run in the context of the current operating system. Skipping the build phase makes actor's development and testing faster, especially when making small changes to the code.
### What is the difference between pushing your code changes and creating a pull request?
  - Pull requests are used to discuss and review code changes between multiple colleagues. Typically, modifications are made in the separate branches and once the developer is ready to share his code, he creates a pull request to merge his working branch with a different branch (e.g. main branch).
  - Pushing code changes to a remote repository is done regularly and does not require code reviews and pull requests each time. Code modification is done on a specific branch and the individual changes are commited and pushed to a remote git repository. Each branch has its own history of commits.
  - A developer who is working alone on a project can push directly to the main branch as it won't create accidental merge conflicts (as long as the modification of same files from different machines is avoided).
### How does the apify push command work? Is it worth using, in your opinion?
  - I tested this command for deploying code to an existing actor on Apify platform. Actor's source code was originally hosted on GitHub. Calling `apify push [ACTORID]` deployed all my actor-related local files to the Apify platform. So it is very useful for local development combined with multi-file code hosted on Apify.
  - An actor's build was started faster when using `apify push` compared to `git push` + GitHub CI with webhooks for actor's build on Apify platform.
  - I would also appreciate `apify pull` command to be able to make changes to actor's source code directly on the Apify platform and than pull changes to my local device similarly to using git.
  - On the other hand, I enjoy having source code in one place on GitHub so I would like to take advantages of both `git push` and `apify push` commands to have my code deployed on GitHub and have faster build start-up at the same time. However, that would lead to having unsynchronized code in more places so it would break eventually.

# Tutorial V Tasks, Storage, API & Client

## Quiz

### What is the relationship between actor and task?
  - A task stores actor's specific configuration and running a task causes running a corresponding actor with this configuration set. Tasks can be created for both private and public actors, even for those that belong to a different user.
  - Both actor and task can be run manually from the Apify platform or using the specific API endpoint.
### What are the differences between default (unnamed) and named storage? Which one would you choose for everyday usage?
  - The main difference is their expiration period. Unnamed storages expire in 7 days whereas named storages are preserved forever. Default unnamed storages are more suitable for daily usage as we don't need to manually assign names to them and they are deleted automatically when we no longer need them. They can be easily accessed by their unique IDs.
  - On the other hand, if we want to emphasize storage's purpose, giving it a fitting name can help with storage identification and usage, especially outside the Apify console.
### What is the relationship between the Apify API and the Apify client? Are there any significant differences?
  - The Apify API offers programmatic access to the Apify platform through RESTful HTTP endpoints. Apify client (`apify-client` NPM or PyPI package) is the official library for accessing Apify API from external applications. Apify provides client libraries for JavaScript and Python applications. JS library can be used both from Node.js and browser.
  -  The functions from Apify client libraries are mapped on the API endpoints and they also have the same parameters. 
### Is it possible to use a request queue for deduplication of product IDs? If yes, how would you do that?
  - A request queue provides an interface for checking whether a specific URL was already enqueued. If a product ID was part of the enqueued URL (as it is with an Amazon scraper example) it could be checked against known URLs. If an URL containing same product ID was present already, adding this URL to the request queue again would cause product duplication.
### What is data retention and how does it work for all types of storage (default and named)?
  - It is an event of data expiration. Default unnamed storages expire after 1 week whereas named storages are retained indefinitely. 
### How do you pass input when running an actor or task via the API?
  - An actor or a task can be run by sending a POST request to a corresponding API endpoint. An input can be passed as a JSON object in the POST payload. In this case, object's fields override actor's default input configuration.

# Tutorial VI Apify Proxy & Bypassing Antiscraping Software

## Quiz

### What types of proxies does the Apify Proxy include? What are the main differences between them?

- **Datacenter proxy**
  - Rotates datacenter IP addresses which makes the crawling fast and cost effective. However, datacenter IPs are more prone to get blocked by the anti-scraping software.
  - Apify offers **shared** or **dedicated** datacenter IPs. Shared IPs are cheaper but the blocking rate depends on other users' actions which makes it difficult to predict. 
- **Residential proxy**
  - Uses real users IP addresses from their households or offices. Thanks to that, it is almost impossible to recognize and block programmatic access when using this proxy. Residential IPs are more expensive and their usage is charged by the amount of data transfer. Dedicated IPs are reserved for one user so they make a good choice in cases where stable crawling rate is important.
- **Google SERP proxy**
  - It is designed specifically for extraction of Google search results. Currently, Google Search and Google Shopping services are supported.

### Which proxies (proxy groups) can users access with the Apify Proxy trial? How long does this trial last?

- The trial lasts for 30 days and only datacenter and Google SERP proxies can be used during this trial. 
- For datacenter proxies, there are 2 groups available for the trial according to the overview in Apify console. These are BUYPROXIES94952 and SHADER which are both proxies from USA. The group for Google SERP is called GOOGLE_SERP.

### How can you prevent a problem that one of the hardcoded proxy groups that a user is using stops working (a problem with a provider)? What should be the best practices?

- A problem with a provider can not be prevented so we should be prepared for this scenario and handle potential errors properly. If the hardcoded proxy is not required and another proxy can be used instead, we might the rotating system to find a new proxy.
- We should periodically check the availability of the hardcoded proxy groups and once they're working again, we might revert back to using them.

### Does it make sense to rotate proxies when you are logged in?

- Log in is only valid per one session and by rotating proxies, new sessions are created. So if we need to stay logged in, rotating proxies won't be useful as we have to keep the same session.
- The session we're logged in has to be persisted. It means we have to use the same IP address for all related connections.  A session expires after 26 hours if used with datacentre proxies and for residential proxies, it persists 1 minute. Its expiry time is reset whenever the session is used.

### Construct a proxy URL that will select proxies **only** from the US (without specific groups).

- http://country-US:<PROXY_PASSWORD>@proxy.apify.com:8000

### What do you need to do to rotate proxies (one proxy usually has one IP)? How does this differ for Cheerio Scraper and Puppeteer Scraper?

- For each request, a new proxy server is used from the pool of available proxy servers. Typically, 1 IP address is assigned to 1 proxy server.
- It's important to work with a large amount of proxies. Sending too many requests to the same website using the same proxy might result in so called proxy burning. In such case, a proxy is banned by the website and all subsequent requests sent from it get blocked.
- `CheerioScraper` sends raw HTTP requests so it can easily assign a different proxy to each request. `PuppeteerCrawler` needs to work with the `puppeteerPool.retire(page.browser())` function as the whole browser has to be retired. 

### Try to set up the Apify Proxy (using any group or `auto`) in your browser. This is useful for testing how websites behave with proxies from specific countries (although most are from the US). You can try [Switchy Omega](https://chrome.google.com/webstore/detail/proxy-switchyomega/padekgcemlokbadohgkifijomclgjgif) extension but there are many more. Were you successful?

- I used Switchy Omega with `auto` username and managed to get status `Connected` after opening http://proxy.apify.com/. But when navigating to other websites, I got ERR_PROXY_CONNECTION_FAILED error. I added another proxy configuration with username `groups-SHADER+BUYPROXIES94952` and it started working for both proxy.apify.com `Connected` status and website browsing. I also noticed I wasn't able to load https://console.apify.com/ under proxy.

### Name a few different ways a website can prevent you from scraping it.

- **IP address blocking**
  - Typically specific ranges of IP addresses are blocked (such as AWS IP address ranges).
- **IP rate limiting**
  - If too many requests are sent from the same IP address, a website might block this IP address or throw a CAPTCHA test.
  - Can be bypassed by limiting the number of pages scraped concurrently (through the `maxConcurrency` option) or by using proxy servers and IPs rotation.
- **HTTP request analysis**
  - Checks browser's HTTP signatures. Can be bypassed by using a real web browser, e.g. headless Chrome or even better work around with browser signatures emulation while sending raw HTTP requests. Apify SDK comes with a `requestAsBrowser()` function which emulates the HTTP headers of the Firefox browser. 
- **User behaviour analysis**
  - Measures the period for which the user stays on each page, analyses mouse movements or form filling speed.
- **Browser fingerprinting**
  - Checks browser's fingerprint consisting of browser type and version, time zone, installed extensions and other info. 

### Do you know any software companies that develop anti-scraping solutions? Have you ever encountered them on a website?

- Various CAPTCHA tests are often used, I've encountered them for example on websites that provide file downloading or user log in.
  - Used e.g. by Google's reCAPTCHA.

# Tutorial VII Actor Migrations & Maintaining State

## Quiz

### Actors have a `Restart on error` option in their Settings. Would you use this for your regular actors? Why? When would you use it, and when not?

- I wouldn't use it for regular actors as it could trigger an infinite loop of restarting if the error was deterministic (wrong input configuration, code bug or something like that). It might burn the credit eventually.
- On the other hand, `restart on error` feature might be useful for long running actors that are supposed to run continuously and  if an error occurs, it's most likely caused by the network connection or some external factors. In this case, it's wiser to keep the actor running and don't wait for a developer to trigger the run restart manually.

### Migrations happen randomly, but by setting `Restart on error` and then throwing an error in the main process, you can force a similar situation. Observe what happens. What changes and what stays the same in a restarted actor run?

- Actor's run is exited with a non-zero exit code and it is restarted eventually. A new Docker container is created and started afterwards. 
- Actor's stores remain the same in a restarted run including INPUT value or persisted state. Dataset also survives for the restarted run.

### Why don't you usually need to add any special code to handle migrations in normal crawling/scraping? Is there a component that essentially solves this problem for you?

 - Resurrection of a finished run handles this problem by restarting actor's run and providing it with the same storages. It is designed not only for migration but for each actor run in a terminal state (with status FINISHED, FAILED, ABORTED or TIME-OUT).

### How can you intercept the migration event? How much time do you need after this takes place and before the actor migrates?

- The migration info can be obtained using the `persistState` event which provides `{ isMigrating: Boolean }` value. This event is emitted in regular intervals which are set to 60 seconds by default.
- Migration itself emits so called `migrating` event which can be used to persist actor's state before the migration process takes place.
- Once the migration event is fired, we only have a few seconds to save actor's current state. After the migration finishes, we can start from the persisted state while restarting actor's run.

### When would you persist data to a default key-value store and when would you use a named key-value store?

- These two stores differ in a retention period so it depends how long do we need to persist data.
- When we want to store data for 7 days only (e. g. for the next actor's run), a default key-value store is a fair choice. Otherwise we should use a named key-value store which never expires.
