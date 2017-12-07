# Metaparticle/storage
Easy implicit, concurrent persistence for [Node.js](https://nodejs.org)

## But what does it do for me?

Metaparticle/storage lets you treat persistent (e.g. MongoDB, Redis or MySQL) storage the same as you treat local storage.
Furthermore it manages concurrent storage access, it automatically detects conflicts, rolls back data transformations and
resolves the conflicts.

## Hrm, I'm not sure what that really means, can you say it in a different way?
Metaparticle/storage makes distributed storage easy.

## Great, but how does it work?
Metaparticle/storage works by defining chunks of data called _scopes_. You define a scope by giving Metaparticle/storage a
scope _name_. Metaparticle/storage gives you back that scope and ensures that all reads/writes within that scope occur
in a single transaction. This means that you are guaranteed that within a scope, data consistency is guaranteed.

## Sounds fancy, can I get an example?
To understand how this works, consider the task of multi-threaded increment of an integer `i`. We have all seen the data race
that can occur:

   1. Thread-1 reads `i`, `i == 0`
   2. Thread-2 reads `i`, `i == 0`
   3. Thread-1 writes `i + 1`, `i == 1`
   4. Thread-2 writes `i + 1`, `i == 1`

You can see that despite two increment operations, the value of the variable only increases by one.

To solve this via Metaparticle/storage, you write:

```js
metaparticle.scoped('global', (data) => {
   data.i++;
   ...
}
```

Metaparticle ensures both that the local modifications to the value `i` are preserved in persistent storage, as well as that
the changes are only preserved if there have been no other concurrent modifications to the data. If Metaparticle detects other
data modifications, it automatically rolls back any of its current data modifications and re-runs the function.

## Give me more!
There are some additional walkthroughs:
   * Basic Example
   * Basic Web Server
   * User-specific scopes

## Details

### Goals
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
