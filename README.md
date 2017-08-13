# Metaparticle storage
Distributed, concurrent, implicit persistence for [Node.js](https://nodejs.org)

## Goals
In distributed systems, persistent state management is often one of the largest design challenges.
The goals of Metaparticle storage are to make this easy. Metaparticle storage achieves this by moving from _explicit_ storage
to _implicit_ storage, and by managing concurrent operations for the user.

### Implicit storage
When we say _implicit_ storage what we mean is that the persistent storage of data occurs _implicitly_ without
user interaction. This contrasts to _explicit_ storage which is what most people write today.

To explain this more completely, we can see that in-memory storage is _implicit_ already in most programming languages:
```js
var i = 0;
...
i = i + 1;
```

But when we encounter a persistence layer, the storage becomes _explicit_:

```js
client.set("i", 0);
...
var value = client.get("i");
client.update("i", value + 1); 
```

The differences between the two code snippets aren't eggregious, but the later introduces a bunch of cognitive
overhead to understanding and writing the code.  What is this `client`? Why do I use an explicit `set` method instead of just
assignment? What was that `value` variable anyway?

Especially since we all learn in-memory _implicit_ storage first, the cognitive overhead is sufficient to make distributed
systems more challenging to more novice programmers. Metaparticle storage resolves this by making persistent storage implicit:

```js
var mp = require('@metaparticle/storage');

mp.scoped('scope', function(data) {
   data.i = 0;
   ...
   data.i = data.i + 1;
});
```

At the end of this code, `i` will have been incremented and stored persistently so that even if the program exits and restarts,
the new value of `i` will be preserved.

### Concurrent Access
The other reason that storage is challenging in distributed systems is that often times there are multiple replicas of
the system and storage operations are being performed simultaneously on multiple different machines or servers. The result
of this is that conflicts can occur and data can be lost or corrupted.

The most common of these patterns is one where two servers simultaneously read the value for `i`. The both increment the value
and then they both store it. In this case, despite two different increment operations, only `i + 1` is actually stored back
into the persistent storage.

Metaparticle storage makes this easy as well, since it takes care of conflict detection, rollback and resolution. The only caveat
of this (there is no free lunch after all). Is that your function has to be side-effect free other than it's interactions with
storage. The reason for this is that the function may be executed multiple time before it can be successfully committed.


