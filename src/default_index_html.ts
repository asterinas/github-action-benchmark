export const DEFAULT_INDEX_HTML = String.raw`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1, user-scalable=yes" />
    <style>
      html {
          font-family: BlinkMacSystemFont,-apple-system,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,"Fira Sans","Droid Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
          -webkit-font-smoothing: antialiased;
          background-color: #fff;
          font-size: 16px;
      }
      body {
          color: #4a4a4a;
          margin: 8px;
          font-size: 1em;
          font-weight: 400;
      }
      header {
            margin-bottom: 8px;
            display: flex;
            flex-direction: column;
      }
      main {
          width: 100%;
          display: flex;
          flex-direction: column;
      }
      a {
          color: #3273dc;
          cursor: pointer;
          text-decoration: none;
      }
      a:hover {
          color: #000;
      }
      button {
          color: #fff;
          background-color: #3298dc;
          border-color: transparent;
          cursor: pointer;
          text-align: center;
      }
      button:hover {
          background-color: #2793da;
          flex: none;
      }
      .spacer {
          flex: auto;
      }
      .small {
          font-size: 0.75rem;
      }
      footer {
          margin-top: 16px;
          display: flex;
          align-items: center;
      }
      .header-label {
          margin-right: 4px;
      }
      .benchmark-set {
          margin: 8px 0;
          width: 100%;
          display: flex;
          flex-direction: column;
      }
      .benchmark-title {
          font-size: 3rem;
          font-weight: 600;
          word-break: break-word;
          text-align: center;
          margin-bottom: 5px;
      }
      .benchmark-graphs {
          display: flex;
          flex-direction: row;
          justify-content: space-around;
          align-items: center;
          flex-wrap: wrap;
          width: 100%;
      }
      .benchmark-chart {
          max-width: 90%;
          width: auto; /* Make width adaptive */
          min-width: 1000px; /* Set minimum width to 1000px */
          background-color: #ffffff; /* White background for better chart display */
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* Slight shadow */
      }
      .benchmark-chart-overview {
          display: flex;
          flex-direction: column;
          max-width: 90%;
          width: auto; /* Make width adaptive */
          min-width: 1000px; /* Set minimum width to 1000px */
          height: 80vh; /* Make height adaptive */
          min-height: 1000px;
          max-height: 1500px; /* Make height adaptive */
          background-color: #ffffff; /* White background for better chart display */
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* Slight shadow */
      }
      .chart-description {
          font-family: 'Courier New', Courier, monospace;
          color: #333; /* Changed to a darker color for better readability */
          font-style: italic;
          font-size: 0.9rem;
          font-weight: 200;
          word-break: break-word;
          text-align: center;
          margin-top: 0px; /* Added margin to create space between the title and the description */
          margin-bottom: 20px; /* Added margin to create space between the description and the figure below it */
      }
  </style>
    <title>Benchmarks</title>
  </head>

  <body>
    <header id="header">
      <div class="header-item">
        <strong class="header-label">Last Update:</strong>
        <span id="last-update"></span>
      </div>
      <div class="header-item">
        <strong class="header-label">Repository:</strong>
        <a id="repository-link" rel="noopener"></a>
      </div>
    </header>
    <main id="main"></main>
    <footer>
      <button id="dl-button">Download data as JSON</button>
      <div class="spacer"></div>
      <div class="small">Powered by <a rel="noopener" href="https://github.com/marketplace/actions/continuous-benchmark">github-action-benchmark</a></div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-tick-configuration"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation"></script> <!-- Include annotation plugin -->
    <script src="data.js"></script>
    <script id="main-script">
      'use strict';
      (function() {
        
        function init() {
          function collectBenchesPerTestCase(entries) {
            const map = new Map();
            for (const entry of entries) {
              const {commit, date, tool, title, description, display, benches} = entry;
              for (const bench of benches) {
                const result = { commit, date, tool, title, description, display, bench };
                const arr = map.get(bench.name);
                if (arr === undefined) {
                  map.set(bench.name, [result]);
                } else {
                  arr.push(result);
                }
              }
            }
            return map;
          }

          const data = window.BENCHMARK_DATA;

          // Render header
          document.getElementById('last-update').textContent = new Date(data.lastUpdate).toString();
          const repoLink = document.getElementById('repository-link');
          repoLink.href = data.repoUrl;
          repoLink.textContent = data.repoUrl;

          // Render footer
          document.getElementById('dl-button').onclick = () => {
            const dataUrl = 'data:,' + JSON.stringify(data, null, 2);
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = 'benchmark_data.json';
            a.click();
          };

          const filter = (() => {
            const pathname = window.location.pathname;
            const pathSegments = pathname.split('/').filter(Boolean);
            if (pathSegments.length < 2) {
              return null; 
            }
            return pathSegments[pathSegments.length - 1];
          })();

          // Prepare data points for charts
          let dataSets;
          if (filter) {
            dataSets = Object.keys(data.entries)
              .filter(name => name.startsWith(filter))
              .map(name => ({
                name,
                dataSet: collectBenchesPerTestCase(data.entries[name]),
              }));
          } else {
            dataSets = Object.keys(data.entries)
              .map(name => ({
                name,
                dataSet: collectBenchesPerTestCase(data.entries[name]),
              }));
          }
          
          dataSets.sort((a, b) => {
            const titleA = a.dataSet.values().next().value[a.dataSet.values().next().value.length - 1].title || a.name;
            const titleB = b.dataSet.values().next().value[b.dataSet.values().next().value.length - 1].title || b.name;
            return titleA.localeCompare(titleB);
          });
          return dataSets;
        }

        // Get normalized data with display flag
        function getNormalizedData(dataSets) {
          function extractValuesAndTitle(map) {
            const linuxEntry = [...map.values()].find(entry => entry[0].bench.extra === 'linux_result');
            const asterinasEntry = [...map.values()].find(entry => entry[0].bench.extra === 'aster_result');

            if (!linuxEntry || !asterinasEntry) {
              throw new Error('Linux or Asterinas entry not found');
            }

            const linuxValue = linuxEntry[linuxEntry.length - 1].bench.value;
            const asterinasValue = asterinasEntry[asterinasEntry.length - 1].bench.value;
            const title = linuxEntry[linuxEntry.length - 1].title; 
            const tool = linuxEntry[linuxEntry.length - 1].tool;
            const display = linuxEntry[linuxEntry.length - 1].display;

            return {
              linuxValue,
              asterinasValue,
              title,
              tool,
              display
            };
          }
          const normalizedDataSets = new Map();
          for (const {name, dataSet} of dataSets) {
            const {linuxValue, asterinasValue, title, tool, display} = extractValuesAndTitle(dataSet);
            if (!display) {
              continue;
            }
            const normalizedData = tool === 'customBiggerIsBetter' ? asterinasValue / linuxValue : linuxValue / asterinasValue;
      
            normalizedDataSets.set(title, normalizedData);
          }
          // Calculate Geometric Mean
          const values = [...normalizedDataSets.values()];
          const geometricMean = Math.pow(values.reduce((acc, val) => acc * val, 1), 1 / values.length);

          // Add Geometric Mean to the result
          normalizedDataSets.set('Geometric Mean', geometricMean);

          return normalizedDataSets;
        }

        function renderAllChars(dataSets) {

          function generateColor(index) {
            const colors = [
              'rgb(255, 99, 132)',  // Red
              'rgb(54, 162, 235)',   // Blue
              'rgb(255, 206, 86)',   // Yellow
              'rgb(75, 192, 192)',   // Teal
              'rgb(153, 102, 255)',  // Purple
              'rgb(255, 159, 64)',   // Orange
              'rgb(199, 199, 199)',  // Gray
              'rgb(144, 238, 144)',  // Light Green
              'rgb(238, 130, 238)',  // Lavender
              'rgb(255, 105, 180)'   // Pink
            ];
            return colors[index % colors.length];
          }

          function renderGraph(parent, benchSets) {
            const canvas = document.createElement('canvas');
            canvas.className = 'benchmark-chart';
            parent.appendChild(canvas);
          
            const datasets = [];
            let index = 0;
            for (const [benchName, benches] of benchSets.entries()) {
              const color = generateColor(index);
              datasets.push({
                label: benchName,
                data: benches.map(d => d.bench.value),
                fill: false,
                borderColor: color,
                backgroundColor: color + '60', // Add alpha for #rrggbbaa
              });
              index++;
            }
          
            const data = {
              // Assuming all datasets has the same commit sequence
              labels: benchSets.values().next().value.map(d => d.commit.id.slice(0, 7)),
              datasets: datasets,
            };
          
            const options = {
                    scales: {
                        x:{
                                title: {
                                    display: true,
                                    text: 'commit',
                                },
                            },
                        y: {
                                title: {
                                    display: true,
                                    // Assuming all datasets has the same unit, take the last one
                                    text: benchSets.values().next().value.length > 0 ? benchSets.values().next().value[benchSets.values().next().value.length - 1].bench.unit : '',
                                },
                                ticks: {
                                    beginAtZero: true,
                                }
                            },
                    },
                    tooltips: {
                        callbacks: {
                            afterTitle: items => {
                                const {index} = items[0];
                                const data = dataset[index];
                                return '\n' + data.commit.message + '\n\n' + data.commit.timestamp + ' committed by @' + data.commit.committer.username + '\n';
                            },
                            label: item => {
                                let label = item.value;
                                const { range, unit } = dataset[item.index].bench;
                                label += ' ' + unit;
                                if (range) {
                                    label += ' (' + range + ')';
                                }
                                return label;
                            },
                            afterLabel: item => {
                                const { extra } = dataset[item.index].bench;
                                return extra ? '\n' + extra : '';
                            }
                        }
                    },
                    onClick: (_mouseEvent, activeElems) => {
                        if (activeElems.length === 0) {
                            return;
                        }
                        const index = activeElems[0]._index;
                        const url = dataset[index].commit.url;
                        window.open(url, '_blank');
                    },
                    responsive: true, // Make chart responsive
                    maintainAspectRatio: false // Do not maintain original aspect ratio
                };

                new Chart(canvas, {
                    type: 'line',
                    data: data,
                    options: options,
                });

            }

          function renderOverview(ctx, labels, asterinasValues) {
                    const canvas = document.createElement('canvas');
                    canvas.className = 'benchmark-chart-overview';
                    ctx.appendChild(canvas);
                    new Chart(canvas, {
                        type: 'bar', // Use bar type
                        data: {
                            labels: labels,
                            datasets: [
                                {
                                    label: 'Asterinas',
                                    data: asterinasValues,
                                    fill: false,
                                    backgroundColor: 'rgba(54, 162, 235, 0.2)', // Swap colors
                                    borderColor: 'rgba(54, 162, 235, 1)', // Swap colors
                                    borderWidth: 1,
                                }
                            ]
                        },
                        options: {
                            indexAxis: 'y', // Set indexAxis to 'y' to create horizontal bar chart
                            scales: {
                                x: {
                                    reverse: true,
                                    ticks: {
                                        stepSize: 0.1,
                                        major: {
                                            enabled: true
                                        },
                                    }
                                },
                                y: {
                                    position: 'right',
                                    ticks: {
                                        autoSkip: false, // Ensure every tick is displayed
                                        font: {
                                            size: 14 // Set font size
                                        },
                                    }
                                }
                            },
                            plugins: {
                                annotation: {
                                    annotations: [
                                        {
                                            type: 'line',
                                            mode: 'horizontal',
                                            scaleID: 'x',
                                            value: 1,
                                            borderColor: 'rgba(0, 0, 0, 0.5)',
                                            borderWidth: 2,
                                            label: {
                                                content: 'Reference Line (x=1)',
                                                enabled: true,
                                                position: 'right'
                                            }
                                        }
                                    ]
                                }
                            },
                            responsive: true, // Make chart responsive
                            maintainAspectRatio: false // Do not maintain original aspect ratio
                        }
                    });
          }

          const main = document.getElementById('main');
          const graphsElem = document.createElement('div');
          graphsElem.className = 'benchmark-graphs';
          main.appendChild(graphsElem);

          const setElem = document.createElement('div');
          setElem.className = 'benchmark-set';
          main.appendChild(setElem);

          const normalizedDataSets = getNormalizedData(dataSets); 
          const labels = Array.from(normalizedDataSets.keys());
          const asterinasValues = Array.from(normalizedDataSets.values());
          const title = "Normalized performance of Asterinas";
          const description = "For bandwidth, use Asterinas / Linux; for latency, use Linux / Asterinas. The higher, the better."
                
          const nameElem = document.createElement('h1');
          nameElem.className = 'benchmark-title';
          nameElem.textContent = title;
          setElem.appendChild(nameElem);

          const descriptionElem = document.createElement('div');
          descriptionElem.className = 'chart-description';
          descriptionElem.textContent = description;
          setElem.appendChild(descriptionElem);

          const overviewElem = document.createElement('div');
          overviewElem.className = 'benchmark-graphs';
          setElem.appendChild(overviewElem);
          
          renderOverview(overviewElem, labels, asterinasValues);
        
          for (const {name, dataSet} of dataSets) {
            // const display = dataSet.values().next().value.length > 0 ? dataSet.values().next().value[0].display : true;
            // if (!display) {
            //   continue;
            // }

            const setElem = document.createElement('div');
            setElem.className = 'benchmark-set';
            main.appendChild(setElem);

            const nameElem = document.createElement('h1');
            nameElem.className = 'benchmark-title';
            nameElem.textContent = dataSet.values().next().value.length > 0 ? dataSet.values().next().value[dataSet.values().next().value.length-1].title : '';
            setElem.appendChild(nameElem);
            console.log(dataSet);
            const descriptionElem = document.createElement('div');
            descriptionElem.className = 'chart-description';
            descriptionElem.textContent = dataSet.values().next().value.length > 0 ? dataSet.values().next().value[dataSet.values().next().value.length-1].description : '';
            setElem.appendChild(descriptionElem);

            const graphsElem = document.createElement('div');
            graphsElem.className = 'benchmark-graphs';
            setElem.appendChild(graphsElem);
            renderGraph(graphsElem, dataSet);
          }
        }
        
        renderAllChars(init()); // Start
      })();
    </script>
  </body>
</html>
`;
