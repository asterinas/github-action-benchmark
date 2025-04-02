import * as core from '@actions/core';
import { configFromJobInput } from './config';
import { extractResult } from './extract';
import { writeBenchmark } from './write';

async function main() {
    const config = await configFromJobInput();
    core.debug(`Config extracted from job: ${config}`);

    const benchmarks = [];
    for (const filePath of config.outputFilePaths) {
        const bench = await extractResult(filePath, config.tool);
        core.debug(`Benchmark result extracted from ${filePath}: ${bench}`);
        benchmarks.push(bench);
    }

    await writeBenchmark(benchmarks, config);

    console.log('github-action-benchmark processed files successfully!', '\nFiles:', config.outputFilePaths);
}

main().catch((e) => core.setFailed(e.message));
