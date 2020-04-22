Worker Threads
==============

Two concurrent requests running a CPU intensive request method in the
main thread:

```
~% time curl 127.0.0.1:3000/main
299993curl 127.0.0.1:3000/main  0.01s user 0.00s system 0% cpu 8.791 total
~% time curl 127.0.0.1:3000/main
299993curl 127.0.0.1:3000/main  0.00s user 0.00s system 0% cpu 16.547 total
```

Two concurrent requests running a CPU intensive request method in worker
threads:

```
~% time curl 127.0.0.1:3000/worker
299993curl 127.0.0.1:3000/worker  0.00s user 0.00s system 0% cpu 9.025 total
~% time curl 127.0.0.1:3000/worker
299993curl 127.0.0.1:3000/worker  0.00s user 0.00s system 0% cpu 9.026 total
```
