# Testing Strategy

## Test layers

- syntax checks
- endpoint checks
- crawler fixture tests
- detector fixture tests
- asset collector tests
- report generation tests
- ZIP validation tests
- storage read/write tests

## Core test goals

- verify the app starts on localhost
- verify every public API route
- verify generated files exist where expected
- verify project history remains readable
- verify exported ZIP files can be downloaded

## Regression focus

- report shape stability
- file path safety
- crawl limits
- asset rewrite accuracy
- backward compatibility for legacy project records

## Suggested automation

- Node script-based tests first
- then endpoint integration tests
- then export integrity tests
- then plugin/provider contract tests
